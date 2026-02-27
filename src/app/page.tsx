'use client';

import { useState, useMemo } from 'react';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { PromptGrid } from '@/components/prompt/PromptGrid';
import { categories } from '@/lib/data';
import { usePrompts } from '@/context/PromptContext';

export default function HomePage() {
  const { prompts } = usePrompts();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPrompts = useMemo(() => {
    if (activeCategory === 'all') {
      return prompts;
    }
    return prompts.filter(prompt => prompt.category === activeCategory);
  }, [activeCategory, prompts]);

  return (
    <div className="min-h-screen">
      {/* Category Navigation */}
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </div>

      {/* Prompt Grid */}
      <div className="max-w-7xl mx-auto">
        <PromptGrid prompts={filteredPrompts} />
      </div>
    </div>
  );
}
