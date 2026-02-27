'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">◈</span>
                        <span className="text-sm text-muted-foreground">
                            PromptVault — Curated AI prompts
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-primary transition-colors">
                            Browse
                        </Link>
                        <Link href="/admin" className="hover:text-primary transition-colors">
                            Admin
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
