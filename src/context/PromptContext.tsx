'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Prompt } from '@/types';

interface PromptContextType {
    prompts: Prompt[];
    isLoading: boolean;
    addPrompt: (prompt: Omit<Prompt, 'id' | 'created_at'>) => Promise<void>;
    refreshPrompts: () => Promise<void>;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export function PromptProvider({ children }: { children: ReactNode }) {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPrompts = async () => {
        try {
            const res = await fetch('/api/prompts');
            if (res.ok) {
                const data = await res.json();
                setPrompts(data);
            }
        } catch (error) {
            console.error('Failed to fetch prompts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrompts();
    }, []);

    const addPrompt = async (promptData: Omit<Prompt, 'id' | 'created_at'>) => {
        try {
            const res = await fetch('/api/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promptData),
            });

            if (res.ok) {
                const newPrompt = await res.json();
                setPrompts((prev) => [newPrompt, ...prev]);
            } else {
                throw new Error('Failed to save prompt');
            }
        } catch (error) {
            console.error('Failed to add prompt:', error);
            throw error;
        }
    };

    const refreshPrompts = async () => {
        setIsLoading(true);
        await fetchPrompts();
    };

    return (
        <PromptContext.Provider value={{ prompts, isLoading, addPrompt, refreshPrompts }}>
            {children}
        </PromptContext.Provider>
    );
}

export function usePrompts() {
    const context = useContext(PromptContext);
    if (context === undefined) {
        throw new Error('usePrompts must be used within a PromptProvider');
    }
    return context;
}
