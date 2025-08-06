import type { Source, DisambiguationChoice } from '../types';

export interface StreamEvent {
    type: 'content' | 'sources';
    payload: any;
}

// This function now calls our secure backend endpoint for disambiguation.
export async function getDisambiguation(query: string): Promise<DisambiguationChoice[]> {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ operation: 'disambiguate', query }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || 'Failed to get disambiguation choices.');
        }

        const choices = await response.json();
        
        if (Array.isArray(choices) && choices.length > 1) {
            return choices;
        }
        return [];

    } catch (error) {
        console.error("Error in getDisambiguation, proceeding as if unambiguous:", error);
        // Gracefully fail by returning an empty array.
        return [];
    }
}


// This async generator now fetches the streaming response from our secure backend.
export async function* fetchArticleStream(query: string): AsyncGenerator<StreamEvent> {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation: 'streamArticle', query }),
    });

    if (!response.ok || !response.body) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to fetch article stream.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            
            // Process buffer line by line for Server-Sent Events (SSE)
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last, possibly incomplete, line

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.substring(6);
                    try {
                        const eventData = JSON.parse(jsonString);
                        yield eventData as StreamEvent;
                    } catch (e) {
                        console.error("Failed to parse stream event:", jsonString);
                    }
                }
            }
        }
    } catch (error) {
         console.error("Error reading from article stream:", error);
         if (error instanceof Error) {
            throw new Error(`خطا در ارتباط با سرور: ${error.message}`);
         }
         throw new Error("یک خطای ناشناخته در هنگام دریافت مقاله رخ داد.");
    } finally {
        reader.releaseLock();
    }
}