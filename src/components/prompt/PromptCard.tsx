'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Prompt } from '@/types';

interface PromptCardProps {
    prompt: Prompt;
    index: number;
}

export function PromptCard({ prompt, index }: PromptCardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Vary heights for masonry effect
    const heights = ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[3/4]', 'aspect-[5/6]'];
    const aspectClass = heights[index % heights.length];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
            className="masonry-item"
        >
            <Link href={`/prompt/${prompt.id}`}>
                <motion.div
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`
                        relative overflow-hidden rounded-2xl cursor-pointer
                        liquid-glass
                        ${aspectClass}
                    `}
                >
                    {/* Loading skeleton */}
                    {!isLoaded && (
                        <div className="absolute inset-0 image-loading" />
                    )}

                    {/* Image */}
                    <Image
                        src={prompt.image_url}
                        alt={prompt.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                        className={`
                            object-cover transition-all duration-500
                            ${isLoaded ? 'opacity-100' : 'opacity-0'}
                            ${isHovered ? 'scale-105' : 'scale-100'}
                        `}
                        onLoad={() => setIsLoaded(true)}
                    />

                    {/* Hover overlay */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 card-gradient"
                    />

                    {/* Content on hover */}
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            y: isHovered ? 0 : 10
                        }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-0 left-0 right-0 p-4"
                    >
                        <h3 className="text-sm font-medium text-white line-clamp-1">
                            {prompt.title}
                        </h3>
                        <p className="text-xs text-white/60 mt-1">
                            {prompt.ai_model}
                        </p>
                    </motion.div>

                    {/* Video indicator */}
                    {prompt.media_type === 'video' && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    )}
                </motion.div>
            </Link>
        </motion.div>
    );
}
