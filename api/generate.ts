// IMPORTANT: This file should be placed in an `api` directory
// It's a serverless function that acts as a secure backend.

import { GoogleGenAI, Type } from "@google/genai";
import type { Source } from '../types';

// This function signature is for Vercel Edge Functions, compatible with many platforms.
export const config = {
  runtime: 'edge',
};

// --- Main Handler ---
// This function is the entry point for all requests to /api/generate.
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { operation, query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { status: 400 });
    }

    switch (operation) {
      case 'disambiguate':
        return await handleDisambiguation(query);
      case 'streamArticle':
        return handleStreamArticle(query);
      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), { status: 400 });
    }
  } catch (error) {
    console.error('API handler error:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500 });
  }
}

// --- Gemini API Initialization (SERVER-SIDE ONLY) ---
// The API key is securely accessed from environment variables on the server.
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set on the server.");
  }
  return new GoogleGenAI({ apiKey });
};


// --- Operation Handlers ---

async function handleDisambiguation(query: string) {
  const ai = getAiClient();

  const disambiguationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: 'A more specific search term in Farsi.' },
            description: { type: Type.STRING, description: 'A short description in Farsi.' }
        },
        required: ['topic', 'description']
    }
  };

  const prompt = `کاربر عبارت "${query}" را جستجو کرده است. این عبارت ممکن است مبهم باشد. اگر چندین معنی رایج و مشخص دارد، لیستی از حداکثر 5 معنی را ارائه بده. برای هر معنی، یک 'topic' (که یک عبارت جستجوی دقیق‌تر به فارسی است) و یک 'description' (توضیحی مختصر به فارسی) ارائه کن. اگر عبارت مبهم نیست یا یک معنی اصلی و واضح دارد، یک لیست خالی برگردان.`;

  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: disambiguationSchema,
      },
  });
  
  const jsonString = response.text.trim() || '[]';
  
  return new Response(jsonString, {
    headers: { 'Content-Type': 'application/json' }
  });
}

function handleStreamArticle(query: string) {
  const ai = getAiClient();
  const prompt = `شما یک دانشنامه جامع و چندزبانه هستید. لطفاً یک مقاله مفصل و دقیق به زبان فارسی در مورد موضوع زیر بنویسید: "${query}". در متن مقاله، کلمات و مفاهیم کلیدی و مهمی که کاربر ممکن است بخواهد در مورد آنها بیشتر بداند را با قرار دادن در دو براکت مشخص کنید، به این صورت: [[مفهوم کلیدی]]. لطفاً اطلاعات را از منابع معتبر تهیه کنید و ساختار مقاله شبیه به یک مقاله ویکی‌پدیا باشد.`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const geminiStream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                thinkingConfig: { thinkingBudget: 0 }
            },
        });

        const allSources: Source[] = [];

        for await (const chunk of geminiStream) {
            const contentPart = chunk.text;
            if (contentPart) {
                sendEvent({ type: 'content', payload: contentPart });
            }
            
            const rawSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (rawSources?.length) {
                 const newSources: Source[] = rawSources
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
            sendEvent({ type: 'sources', payload: uniqueSources });
        }
      } catch (error) {
          console.error("Error during stream generation:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown stream error";
          sendEvent({ type: 'error', payload: errorMessage });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}