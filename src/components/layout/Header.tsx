'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SearchModal } from '@/components/search/SearchModal';
import { useTheme } from '@/context/ThemeContext';

export function Header() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Global Cmd+K / Ctrl+K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    return (
        <>
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="fixed top-0 left-0 right-0 z-50 glass"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="text-2xl">◈</span>
                            <span className="text-xl font-semibold tracking-tight">
                                PromptVault
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {/* Search trigger */}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground liquid-glass-pill rounded-xl transition-all duration-200"
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
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <span className="hidden sm:inline text-xs">Search</span>
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 bg-background/30 border border-border rounded ml-1">
                                    ⌘K
                                </kbd>
                            </button>

                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-foreground liquid-glass-pill rounded-xl transition-all duration-200"
                                aria-label="Toggle theme"
                            >
                                {theme === 'dark' ? (
                                    /* Sun icon */
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    /* Moon icon */
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>

                            <nav className="hidden md:flex items-center gap-6">
                                <Link
                                    href="/admin"
                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Admin
                                </Link>
                            </nav>
                        </div>
                    </div>
                </div>
            </motion.header>

            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
