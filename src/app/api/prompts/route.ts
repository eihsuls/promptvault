import { NextRequest, NextResponse } from 'next/server';
import { getPrompts, addPrompt } from '@/lib/storage';

export async function GET() {
    try {
        const prompts = await getPrompts();
        return NextResponse.json(prompts);
    } catch (error) {
        console.error('Error fetching prompts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prompts' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { title, prompt_text, image_url, video_url, media_type, ai_model, style, tags, category } = body;

        if (!title || !prompt_text || !image_url) {
            return NextResponse.json(
                { error: 'title, prompt_text, and image_url are required' },
                { status: 400 }
            );
        }

        const newPrompt = await addPrompt({
            title,
            prompt_text,
            image_url,
            video_url: video_url || undefined,
            media_type: media_type || 'image',
            ai_model: ai_model || 'Unknown',
            style: style || '',
            tags: tags || [],
            category: category || 'abstract',
        });

        return NextResponse.json(newPrompt, { status: 201 });
    } catch (error) {
        console.error('Error creating prompt:', error);
        return NextResponse.json(
            { error: 'Failed to create prompt' },
            { status: 500 }
        );
    }
}
