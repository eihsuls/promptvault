import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

interface ScrapeResult {
    title: string;
    prompt_text: string;
    image_url: string;
    source_url: string;
    ai_model?: string;
    style?: string;
    tags?: string[];
    category?: string;
}

// ─── Content Extraction ────────────────────────────────────────────

// Extract all meaningful text from a page (post body, comments, etc.)
function extractPageContent($: cheerio.CheerioAPI): string {
    // Remove scripts, styles, navs, footers, ads
    $('script, style, nav, footer, header, iframe, noscript, .ad, .ads, [role="navigation"]').remove();

    // Get all text content
    const textParts: string[] = [];

    // Try common content selectors first
    const contentSelectors = [
        'article',
        '[role="main"]',
        'main',
        '.post-content',
        '.tweet-text',
        '.comment',
        '.reply',
        '[data-testid="tweetText"]',
        '.markdown-body',
        '.readme',
        '.entry-content',
        '.post-body',
    ];

    for (const selector of contentSelectors) {
        $(selector).each((_, el) => {
            const text = $(el).text().trim();
            if (text.length > 20) {
                textParts.push(text);
            }
        });
    }

    // If no specific content found, get body text
    if (textParts.length === 0) {
        const bodyText = $('body').text().trim();
        textParts.push(bodyText);
    }

    // Limit to ~8000 chars to stay within Gemini context
    return textParts.join('\n\n---\n\n').slice(0, 8000);
}

// Extract all images from the page
function extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];

    // OG image first (highest priority)
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) images.push(ogImage);

    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && !images.includes(twitterImage)) images.push(twitterImage);

    // Large images from the page
    $('img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src') || '';
        if (!src) return;

        // Resolve relative URLs
        let fullUrl = src;
        try {
            fullUrl = new URL(src, baseUrl).href;
        } catch {
            return;
        }

        // Skip tiny images, icons, avatars
        const width = parseInt($(el).attr('width') || '0');
        const height = parseInt($(el).attr('height') || '0');
        if ((width > 0 && width < 100) || (height > 0 && height < 100)) return;

        // Skip common non-content images
        if (/avatar|icon|logo|badge|emoji|profile/i.test(src)) return;

        if (!images.includes(fullUrl)) {
            images.push(fullUrl);
        }
    });

    return images.slice(0, 5); // Max 5 images
}

// ─── Twitter/X Handling ────────────────────────────────────────────

async function fetchTwitterContent(url: string): Promise<{ text: string; images: string[] }> {
    const images: string[] = [];
    let tweetText = '';

    // Try fxtwitter API first (free proxy that provides full tweet data + media)
    try {
        const tweetMatch = url.match(/status\/(\d+)/);
        const userMatch = url.match(/(?:twitter\.com|x\.com)\/([^/]+)/);
        if (tweetMatch && userMatch) {
            const fxUrl = `https://api.fxtwitter.com/${userMatch[1]}/status/${tweetMatch[1]}`;
            const fxRes = await fetch(fxUrl);
            if (fxRes.ok) {
                const fxData = await fxRes.json();
                const tweet = fxData.tweet;
                if (tweet) {
                    tweetText = tweet.text || '';
                    // Get media (images/videos)
                    if (tweet.media?.photos) {
                        for (const photo of tweet.media.photos) {
                            if (photo.url) images.push(photo.url);
                        }
                    }
                    if (tweet.media?.mosaic?.formats?.webp) {
                        images.push(tweet.media.mosaic.formats.webp);
                    }
                    // Get quote tweet or reply context if available
                    if (tweet.quote?.text) {
                        tweetText += '\n\nQuoted tweet: ' + tweet.quote.text;
                    }
                }
            }
        }
    } catch {
        // Fall back to oEmbed
    }

    // Fallback: oEmbed for tweet text if fxtwitter failed
    if (!tweetText) {
        const normalizedUrl = url.replace('x.com', 'twitter.com');
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omit_script=true`;
        try {
            const res = await fetch(oembedUrl);
            if (res.ok) {
                const data = await res.json();
                const $ = cheerio.load(data.html);
                tweetText = $('p').text().trim();
            }
        } catch {
            // Continue
        }
    }

    // Fallback: try page OG tags for images
    if (images.length === 0) {
        try {
            const pageRes = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                },
            });
            const html = await pageRes.text();
            const $ = cheerio.load(html);

            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) images.push(ogImage);

            const twitterImage = $('meta[name="twitter:image"]').attr('content');
            if (twitterImage && !images.includes(twitterImage)) images.push(twitterImage);

            const additionalText = $('meta[property="og:description"]').attr('content') || '';
            if (additionalText && !tweetText.includes(additionalText)) {
                tweetText += '\n\n' + additionalText;
            }
        } catch {
            // Continue
        }
    }

    return { text: tweetText, images };
}

// ─── GitHub Handling ───────────────────────────────────────────────

async function fetchGitHubContent(url: string): Promise<{ text: string; images: string[] }> {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/blob\/[^/]+\/(.+))?/);
    if (!match) return { text: '', images: [] };

    const [, owner, repo, filePath] = match;
    const images: string[] = [];

    let text = '';

    if (filePath) {
        // Specific file
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
        try {
            let res = await fetch(rawUrl);
            if (!res.ok) {
                res = await fetch(rawUrl.replace('/main/', '/master/'));
            }
            if (res.ok) {
                text = await res.text();
            }
        } catch {
            // Continue
        }
    } else {
        // Repo root — get README
        try {
            const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
                headers: { Accept: 'application/vnd.github.v3+json' },
            });
            if (readmeRes.ok) {
                const data = await readmeRes.json();
                if (data.content) {
                    text = Buffer.from(data.content, 'base64').toString('utf-8');
                }
            }
        } catch {
            // Continue
        }
    }

    // Get OG image
    try {
        const pageRes = await fetch(url);
        const html = await pageRes.text();
        const $ = cheerio.load(html);
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) images.push(ogImage);
    } catch {
        // Continue
    }

    return { text: text.slice(0, 8000), images };
}

// ─── Generic Page Handling ─────────────────────────────────────────

async function fetchGenericContent(url: string): Promise<{ text: string; images: string[] }> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    });

    if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const text = extractPageContent($);
    const images = extractImages($, url);

    return { text, images };
}

// ─── Groq AI Analysis ──────────────────────────────────────────────

async function analyzeWithAI(
    pageText: string,
    images: string[],
    sourceUrl: string
): Promise<ScrapeResult> {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    const systemPrompt = `You are an expert at analyzing social media posts about AI-generated artwork. You understand the difference between a short social media CAPTION (e.g. "Check out this cool headshot!") and an actual AI GENERATION PROMPT (e.g. "professional headshot of a woman, studio lighting, clean background, 8k, photorealistic, shallow depth of field"). Your job is to always return a detailed, usable AI generation prompt.`;

    const userPrompt = `Analyze this page content and extract or create a proper AI generation prompt.

Page content (post body + comments):
---
${pageText}
---

Source URL: ${sourceUrl}
Images found: ${images.length > 0 ? images.join(', ') : 'None'}

Available categories (use the slug value): cinematic, portraits, sci-fi, fantasy, abstract, architecture, nature, anime

CRITICAL INSTRUCTIONS for "prompt_text":
1. Search the ENTIRE text for anything that looks like an AI generation prompt (detailed descriptions with style keywords, lighting terms, camera angles, quality modifiers like "8k", "photorealistic", etc.)
2. If you find an actual prompt, use it EXACTLY as written.
3. If the text is just a short caption/description (NOT a usable prompt), you MUST write a highly detailed AI generation prompt yourself. Include:
   - Subject description (what is depicted in detail)
   - Style keywords (photorealistic, cinematic, illustration, etc.)
   - Lighting (studio lighting, golden hour, dramatic shadows, etc.)
   - Composition (close-up, wide shot, portrait orientation, etc.)
   - Quality modifiers (8k, highly detailed, sharp focus, etc.)
   - Mood/atmosphere descriptors
   The prompt should be detailed enough that pasting it into Midjourney/DALL-E/Stable Diffusion would produce a similar image.

Extract and respond with ONLY this JSON:
{
  "title": "A short, descriptive title for the artwork (describe what is depicted, NOT a username)",
  "prompt_text": "A detailed, production-ready AI generation prompt (see instructions above)",
  "image_url": "Best image URL from the list (skip avatars/icons), or empty string",
  "ai_model": "AI model mentioned (Midjourney, DALL-E, Stable Diffusion, Flux, Sora, Gemini, etc.) or Unknown",
  "style": "Artistic style (Cyberpunk, Fantasy, Photorealistic, Anime, etc.)",
  "category": "Best matching category slug from: cinematic, portraits, sci-fi, fantasy, abstract, architecture, nature, anime",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1024,
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Groq API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
        throw new Error('Empty response from Groq');
    }

    // Parse JSON (handle possible code fences)
    let jsonStr = content;
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    try {
        const parsed = JSON.parse(jsonStr);
        return {
            title: parsed.title || 'Untitled',
            prompt_text: parsed.prompt_text || '',
            image_url: parsed.image_url || (images.length > 0 ? images[0] : ''),
            source_url: sourceUrl,
            ai_model: parsed.ai_model || 'Unknown',
            style: parsed.style || '',
            category: parsed.category || '',
            tags: parsed.tags || [],
        };
    } catch {
        console.error('Failed to parse Groq response:', content);
        return {
            title: 'Untitled',
            prompt_text: pageText.slice(0, 500),
            image_url: images.length > 0 ? images[0] : '',
            source_url: sourceUrl,
        };
    }
}

// ─── Platform Detection ────────────────────────────────────────────

function isTwitterUrl(url: string): boolean {
    return /https?:\/\/(www\.)?(twitter\.com|x\.com)\//i.test(url);
}

function isGitHubUrl(url: string): boolean {
    return /https?:\/\/(www\.)?github\.com\//i.test(url);
}

// ─── Main Handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Step 1: Fetch content based on platform
        let content: { text: string; images: string[] };

        if (isTwitterUrl(url)) {
            content = await fetchTwitterContent(url);
        } else if (isGitHubUrl(url)) {
            content = await fetchGitHubContent(url);
        } else {
            content = await fetchGenericContent(url);
        }

        if (!content.text && content.images.length === 0) {
            return NextResponse.json(
                { error: 'Could not extract any content from this URL' },
                { status: 422 }
            );
        }

        // Step 2: Analyze with Groq AI
        const result = await analyzeWithAI(content.text, content.images, url);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Scrape error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to scrape URL',
            },
            { status: 500 }
        );
    }
}
