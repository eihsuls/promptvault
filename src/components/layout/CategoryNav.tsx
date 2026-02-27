'use client';

import { motion } from 'framer-motion';
import { Category } from '@/types';

interface CategoryNavProps {
    categories: Category[];
    activeCategory: string;
    onCategoryChange: (slug: string) => void;
}

export function CategoryNav({
    categories,
    activeCategory,
    onCategoryChange,
}: CategoryNavProps) {
    return (
        <div className="relative">
            <div className="overflow-x-auto hide-scrollbar">
                <motion.nav
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex items-center gap-2 py-4 px-4 sm:px-6 lg:px-8 min-w-max"
                >
                    {categories.map((category, index) => {
                        const isActive = activeCategory === category.slug;
                        return (
                            <motion.button
                                key={category.id}
                                onClick={() => onCategoryChange(category.slug)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.05 * index }}
                                className={`
                                    relative px-4 py-2 rounded-2xl text-sm font-medium
                                    transition-all duration-300 whitespace-nowrap
                                    ${isActive
                                        ? 'liquid-glass-pill-active'
                                        : 'liquid-glass-pill text-muted-foreground hover:text-foreground'
                                    }
                                `}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                </span>
                            </motion.button>
                        );
                    })}
                </motion.nav>
            </div>

            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    );
}
