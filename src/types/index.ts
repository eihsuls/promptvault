// Type definitions for PromptVault

export interface Prompt {
    id: string;
    title: string;
    prompt_text: string;
    negative_prompt?: string;
    image_url: string;
    video_url?: string;
    media_type: 'image' | 'video';
    ai_model: string;
    style: string;
    tags: string[];
    category: string;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}
