import { promises as fs } from 'fs';
import path from 'path';
import { Prompt } from '@/types';

const DATA_FILE = path.join(process.cwd(), 'data', 'prompts.json');

export async function getPrompts(): Promise<Prompt[]> {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data) as Prompt[];
    } catch (error) {
        console.error('Error reading prompts:', error);
        return [];
    }
}

export async function savePrompts(prompts: Prompt[]): Promise<void> {
    await fs.writeFile(DATA_FILE, JSON.stringify(prompts, null, 4), 'utf-8');
}

export async function addPrompt(
    promptData: Omit<Prompt, 'id' | 'created_at'>
): Promise<Prompt> {
    const prompts = await getPrompts();

    const newPrompt: Prompt = {
        ...promptData,
        id: Date.now().toString(),
        created_at: new Date().toISOString().split('T')[0],
    };

    prompts.unshift(newPrompt);
    await savePrompts(prompts);

    return newPrompt;
}

export async function deletePrompt(id: string): Promise<boolean> {
    const prompts = await getPrompts();
    const filtered = prompts.filter((p) => p.id !== id);

    if (filtered.length === prompts.length) return false;

    await savePrompts(filtered);
    return true;
}
