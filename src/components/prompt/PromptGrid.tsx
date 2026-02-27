'use client';

import { Prompt } from '@/types';
import { PromptCard } from './PromptCard';

interface PromptGridProps {
    prompts: Prompt[];
}

export function PromptGrid({ prompts }: PromptGridProps) {
    if (prompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-lg">No prompts found</p>
                <p className="text-muted-foreground/60 text-sm mt-2">
                    Try selecting a different category
                </p>
            </div>
        );
    }

    return (
        <div className="masonry-grid px-4 sm:px-6 lg:px-8 py-6">
            {prompts.map((prompt, index) => (
                <PromptCard key={prompt.id} prompt={prompt} index={index} />
            ))}
        </div>
    );
}
