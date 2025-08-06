import { GoogleGenAI, Type } from "@google/genai";
import type { Source, DisambiguationChoice } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const disambiguationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            topic: {
                type: Type.STRING,
                description: 'A more specific search term for one of the meanings, in Farsi.'
            },
            description: {
                type: Type.STRING,
                description: 'A short description of the topic in Farsi.'
            }
        },
        required: ['topic', 'description']
    }
};


export async function getDisambiguation(query: string): Promise<DisambiguationChoice[]> {
    try {
        const prompt = `کاربر عبارت "${query}" را جستجو کرده است. این عبارت ممکن است مبهم باشد. اگر چندین معنی رایج و مشخص دارد، لیستی از حداکثر 5 معنی را ارائه بده. برای هر معنی، یک 'topic' (که یک عبارت جستجوی دقیق‌تر به فارسی است) و یک 'description' (توضیحی مختصر به فارسی) ارائه کن. اگر عبارت مبهم نیست یا یک معنی اصلی و واضح دارد، یک لیست خالی برگردان. خروجی باید با فرمت JSON باشد.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: disambiguationSchema,
            },
        });

        const jsonString = response.text.trim();
        if (!jsonString) {
            return [];
        }

        const choices = JSON.parse(jsonString);
        
        if (Array.isArray(choices)) {
            return choices;
        }

        return [];

    } catch (error) {
        console.error("Error in getDisambiguation, proceeding as if unambiguous:", error);
        // Gracefully fail by returning an empty array, allowing the app to proceed.
        return [];
    }
}


export interface StreamEvent {
    type: 'content' | 'sources';
    payload: any;
}

export async function* fetchArticleStream(query: string): AsyncGenerator<StreamEvent> {
    try {
        const prompt = `شما یک دانشنامه جامع و چندزبانه هستید. لطفاً یک مقاله مفصل و دقیق به زبان فارسی در مورد موضوع زیر بنویسید: "${query}". در متن مقاله، کلمات و مفاهیم کلیدی و مهمی که کاربر ممکن است بخواهد در مورد آنها بیشتر بداند را با قرار دادن در دو براکت مشخص کنید، به این صورت: [[مفهوم کلیدی]]. لطفاً اطلاعات را از منابع معتبر تهیه کنید و ساختار مقاله شبیه به یک مقاله ویکی‌پدیا باشد.`;

        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 0 }
            },
        });

        const allSources: Source[] = [];

        for await (const chunk of stream) {
            const contentPart = chunk.text;
            if (contentPart) {
                yield { type: 'content', payload: contentPart };
            }
            
            const rawSourcesInChunk = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (rawSourcesInChunk && rawSourcesInChunk.length > 0) {
                 const newSources: Source[] = rawSourcesInChunk
                    .map((s: any) => ({
                        uri: s.web?.uri || '',
                        title: s.web?.title || 'منبع نامشخص'
                    }))
                    .filter((source: Source) => source.uri);
                allSources.push(...newSources);
            }
        }
        
        if (allSources.length > 0) {
            const uniqueSources = Array.from(new Map(allSources.map(s => [s.uri, s])).values());
            yield { type: 'sources', payload: uniqueSources };
        }

    } catch (error) {
        console.error("Error fetching article from Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`خطا در ارتباط با سرویس هوش مصنوعی: ${error.message}`);
        }
        throw new Error("یک خطای ناشناخته در هنگام دریافت مقاله رخ داد.");
    }
};