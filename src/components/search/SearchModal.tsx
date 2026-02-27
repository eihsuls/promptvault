'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrompts } from '@/context/PromptContext';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { prompts } = usePrompts();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return prompts
            .filter((p) => {
                return (
                    p.title.toLowerCase().includes(q) ||
                    p.prompt_text.toLowerCase().includes(q) ||
                    p.ai_model.toLowerCase().includes(q) ||
                    p.style.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    p.tags.some((tag) => tag.toLowerCase().includes(q))
                );
            })
            .slice(0, 8);
    }, [query, prompts]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                navigateToResult(results[selectedIndex].id);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    useEffect(() => {
        if (resultsRef.current) {
            const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
            selected?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const navigateToResult = (id: string) => {
        onClose();
        router.push(`/prompt/${id}`);
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="search-backdrop"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-[60] flex items-start justify-center pt-[20vh] px-4"
                    >
                        <div className="w-full max-w-xl liquid-glass rounded-2xl overflow-hidden">
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                                <svg
                                    className="w-5 h-5 text-primary shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search prompts, styles, models, tags..."
                                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                                />

                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground liquid-glass-pill rounded">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
                                {query.trim() === '' ? (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-muted-foreground text-sm">
                                            Start typing to search prompts...
                                        </p>
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-muted-foreground text-sm">
                                            No prompts found for &ldquo;{query}&rdquo;
                                        </p>
                                        <p className="text-muted-foreground/60 text-xs mt-1">
                                            Try a different keyword
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        {results.map((prompt, index) => (
                                            <button
                                                key={prompt.id}
                                                onClick={() => navigateToResult(prompt.id)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`search-result-item w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${index === selectedIndex
                                                        ? 'bg-primary/10'
                                                        : 'hover:bg-accent/40'
                                                    }`}
                                            >
                                                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-muted">
                                                    <Image
                                                        src={prompt.image_url}
                                                        alt={prompt.title}
                                                        fill
                                                        sizes="40px"
                                                        className="object-cover"
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {prompt.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-primary/80">
                                                            {prompt.ai_model}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground/40">•</span>
                                                        <span className="text-xs text-muted-foreground capitalize">
                                                            {prompt.category}
                                                        </span>
                                                    </div>
                                                </div>

                                                {index === selectedIndex && (
                                                    <svg
                                                        className="w-4 h-4 text-primary shrink-0"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 5l7 7-7 7"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            {results.length > 0 && (
                                <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground/60">
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-px liquid-glass-pill rounded text-[10px]">↑</kbd>
                                        <kbd className="px-1 py-px liquid-glass-pill rounded text-[10px]">↓</kbd>
                                        navigate
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1 py-px liquid-glass-pill rounded text-[10px]">↵</kbd>
                                        open
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <kbd className="px-1.5 py-px liquid-glass-pill rounded text-[10px]">esc</kbd>
                                        close
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
