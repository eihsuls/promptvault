'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { categories } from '@/lib/data';
import { usePrompts } from '@/context/PromptContext';

// Simple password protection - in production, use proper auth
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

export default function AdminPage() {
    const router = useRouter();
    const { addPrompt } = usePrompts();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeError, setScrapeError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        prompt_text: '',
        image_url: '',
        video_url: '',
        media_type: 'image' as 'image' | 'video',
        ai_model: '',
        style: '',
        tags: '',
        category: '',
    });

    useEffect(() => {
        // Check if already authenticated in session
        const auth = sessionStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('admin_auth', 'true');
            toast.success('Logged in successfully');
        } else {
            toast.error('Invalid password');
        }
    };

    const handleScrape = async () => {
        if (!scrapeUrl.trim()) {
            toast.error('Please enter a URL');
            return;
        }

        setIsScraping(true);
        setScrapeError('');

        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: scrapeUrl.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to scrape URL');
            }

            // Auto-fill the form with scraped data (including Groq AI analysis)
            setFormData((prev) => ({
                ...prev,
                title: data.title || prev.title,
                prompt_text: data.prompt_text || prev.prompt_text,
                image_url: data.image_url || prev.image_url,
                ai_model: data.ai_model || prev.ai_model,
                style: data.style || prev.style,
                category: data.category || prev.category,
                tags: data.tags ? data.tags.join(', ') : prev.tags,
            }));

            toast.success('Scraped successfully! Review and edit the form below.');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to scrape URL';
            setScrapeError(message);
            toast.error(message);
        } finally {
            setIsScraping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await addPrompt({
                title: formData.title,
                prompt_text: formData.prompt_text,
                image_url: formData.image_url,
                video_url: formData.video_url || undefined,
                media_type: formData.media_type,
                ai_model: formData.ai_model,
                style: formData.style,
                tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
                category: formData.category,
            });

            toast.success('Prompt saved! It will appear on the homepage.');

            // Reset form
            setFormData({
                title: '',
                prompt_text: '',
                image_url: '',
                video_url: '',
                media_type: 'image',
                ai_model: '',
                style: '',
                tags: '',
                category: '',
            });
            setScrapeUrl('');
        } catch {
            toast.error('Failed to save prompt');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold mb-2">Admin Access</h1>
                        <p className="text-muted-foreground">Enter password to continue</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-center"
                        />
                        <Button type="submit" className="w-full">
                            Login
                        </Button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-semibold">Add Prompt</h1>
                            <p className="text-muted-foreground mt-1">
                                Paste a URL or fill in manually
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/')}
                            >
                                View Gallery
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsAuthenticated(false);
                                    sessionStorage.removeItem('admin_auth');
                                }}
                            >
                                Logout
                            </Button>
                        </div>
                    </div>

                    {/* URL Scrape Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <svg
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                />
                            </svg>
                            <h2 className="text-lg font-medium">Import from URL</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Paste a link from X/Twitter, GitHub, or any website. We&apos;ll extract what we can automatically.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                value={scrapeUrl}
                                onChange={(e) => setScrapeUrl(e.target.value)}
                                placeholder="https://x.com/user/status/... or any URL"
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleScrape();
                                    }
                                }}
                            />
                            <Button
                                onClick={handleScrape}
                                disabled={isScraping || !scrapeUrl.trim()}
                                className="min-w-[100px]"
                            >
                                {isScraping ? (
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Scraping
                                    </span>
                                ) : (
                                    'Scrape'
                                )}
                            </Button>
                        </div>

                        <AnimatePresence>
                            {scrapeError && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm text-red-400 mt-2"
                                >
                                    {scrapeError}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Divider */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-3 text-muted-foreground">
                                prompt details
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="Neon Tokyo Nightscape"
                                required
                            />
                        </div>

                        {/* Prompt Text */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt_text">Prompt Text</Label>
                            <Textarea
                                id="prompt_text"
                                value={formData.prompt_text}
                                onChange={(e) =>
                                    setFormData({ ...formData, prompt_text: e.target.value })
                                }
                                placeholder="A cinematic wide shot of rain-soaked Tokyo streets..."
                                rows={5}
                                required
                            />
                        </div>

                        {/* Media Type */}
                        <div className="space-y-2">
                            <Label>Media Type</Label>
                            <Select
                                value={formData.media_type}
                                onValueChange={(value: 'image' | 'video') =>
                                    setFormData({ ...formData, media_type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Image URL */}
                        <div className="space-y-2">
                            <Label htmlFor="image_url">
                                {formData.media_type === 'video' ? 'Thumbnail URL' : 'Image URL'}
                            </Label>
                            <Input
                                id="image_url"
                                value={formData.image_url}
                                onChange={(e) =>
                                    setFormData({ ...formData, image_url: e.target.value })
                                }
                                placeholder="https://images.unsplash.com/..."
                                required
                            />
                            {/* Image Preview */}
                            <AnimatePresence>
                                {formData.image_url && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-2 rounded-lg overflow-hidden border border-border"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            className="w-full max-h-48 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Video URL (conditional) */}
                        {formData.media_type === 'video' && (
                            <div className="space-y-2">
                                <Label htmlFor="video_url">Video URL</Label>
                                <Input
                                    id="video_url"
                                    value={formData.video_url}
                                    onChange={(e) =>
                                        setFormData({ ...formData, video_url: e.target.value })
                                    }
                                    placeholder="https://res.cloudinary.com/..."
                                />
                            </div>
                        )}

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories
                                        .filter((c) => c.slug !== 'all')
                                        .map((category) => (
                                            <SelectItem key={category.id} value={category.slug}>
                                                {category.icon} {category.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* AI Model */}
                        <div className="space-y-2">
                            <Label htmlFor="ai_model">AI Model</Label>
                            <Input
                                id="ai_model"
                                value={formData.ai_model}
                                onChange={(e) =>
                                    setFormData({ ...formData, ai_model: e.target.value })
                                }
                                placeholder="Midjourney v6"
                                required
                            />
                        </div>

                        {/* Style */}
                        <div className="space-y-2">
                            <Label htmlFor="style">Style</Label>
                            <Input
                                id="style"
                                value={formData.style}
                                onChange={(e) =>
                                    setFormData({ ...formData, style: e.target.value })
                                }
                                placeholder="Cyberpunk"
                                required
                            />
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (comma-separated)</Label>
                            <Input
                                id="tags"
                                value={formData.tags}
                                onChange={(e) =>
                                    setFormData({ ...formData, tags: e.target.value })
                                }
                                placeholder="cinematic, tokyo, neon, night"
                            />
                        </div>

                        <Button type="submit" size="lg" className="w-full">
                            Save Prompt
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
