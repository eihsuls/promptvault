'use client';

import { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { usePrompts } from '@/context/PromptContext';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PromptDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const { prompts } = usePrompts();
    const [copied, setCopied] = useState(false);

    const prompt = prompts.find(p => p.id === id);

    if (!prompt) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold mb-2">Prompt not found</h1>
                    <p className="text-muted-foreground mb-6">
                        The prompt you&apos;re looking for doesn&apos;t exist.
                    </p>
                    <Link href="/">
                        <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                            Back to Gallery
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt.prompt_text);
            setCopied(true);
            toast.success('Prompt copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Failed to copy prompt');
        }
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back button */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Gallery
                    </Link>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Media Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="relative aspect-[4/5] rounded-2xl overflow-hidden liquid-glass"
                    >
                        {prompt.media_type === 'video' && prompt.video_url ? (
                            <video
                                src={prompt.video_url}
                                controls
                                className="w-full h-full object-cover"
                                poster={prompt.image_url}
                            />
                        ) : (
                            <Image
                                src={prompt.image_url}
                                alt={prompt.title}
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                                priority
                            />
                        )}
                    </motion.div>

                    {/* Prompt Details */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="flex flex-col"
                    >
                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                            {prompt.title}
                        </h1>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="liquid-glass-pill-active px-3 py-1 rounded-xl text-sm font-medium">
                                {prompt.ai_model}
                            </span>
                            <span className="liquid-glass-pill px-3 py-1 rounded-xl text-sm text-muted-foreground">
                                {prompt.style}
                            </span>
                        </div>

                        {/* Prompt text */}
                        <div className="relative mb-6">
                            <div className="p-4 sm:p-6 liquid-glass rounded-2xl">
                                <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                    {prompt.prompt_text}
                                </p>
                            </div>

                            {/* Copy button — Orange accent */}
                            <button
                                onClick={handleCopyPrompt}
                                className="mt-4 w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {copied ? (
                                    <>
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                        Copy Prompt
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Tags */}
                        {prompt.tags.length > 0 && (
                            <div className="mt-auto pt-6 border-t border-border">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {prompt.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="liquid-glass-pill px-3 py-1 text-sm rounded-xl text-muted-foreground"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
