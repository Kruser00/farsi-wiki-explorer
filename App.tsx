import React, { useState, useCallback } from 'react';
import type { Article, DisambiguationChoice } from './types';
import { getDisambiguation, fetchArticleStream } from './services/geminiService';
import type { StreamEvent } from './services/geminiService';
import SearchBar from './components/SearchBar';
import ArticleDisplay from './components/ArticleDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import BookOpenIcon from './components/icons/BookOpenIcon';
import DisambiguationChoices from './components/DisambiguationChoices';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [originalQuery, setOriginalQuery] = useState<string>('');
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [disambiguationChoices, setDisambiguationChoices] = useState<DisambiguationChoice[]>([]);

  const startArticleStream = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    setArticle({ title: searchQuery, content: '', sources: [] });
    setDisambiguationChoices([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const stream = fetchArticleStream(searchQuery);
      for await (const event of stream) {
        if (event.type === 'content') {
            setArticle(prev => {
                if (!prev) return null;
                return { ...prev, content: prev.content + event.payload };
            });
        } else if (event.type === 'sources') {
            setArticle(prev => {
                if (!prev) return null;
                return { ...prev, sources: event.payload };
            });
        }
      }
    } catch (err) {
      setArticle(null);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("یک خطای ناشناخته رخ داده است.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setError("لطفاً یک موضوع برای جستجو وارد کنید.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setArticle(null);
    setDisambiguationChoices([]);
    setOriginalQuery(query);

    try {
      const choices = await getDisambiguation(query);
      if (choices && choices.length > 1) {
        setDisambiguationChoices(choices);
        setIsLoading(false);
      } else {
        await startArticleStream(query);
      }
    } catch (err) {
      console.error("Disambiguation check failed, fetching article directly:", err);
      await startArticleStream(query);
    }
  }, [query, startArticleStream]);

  const handleTopicSelect = useCallback((topic: string) => {
    setQuery(topic);
    startArticleStream(topic);
  }, [startArticleStream]);

  const WelcomeScreen = () => (
    <div className="text-center text-gray-300 animate-fade-in mt-10 sm:mt-16">
        <BookOpenIcon className="w-24 h-24 mx-auto mb-4 text-purple-400" />
        <h2 className="text-3xl font-bold text-white">به کاوشگر ویکی فارسی خوش آمدید</h2>
        <p className="mt-2 text-lg">موضوع مورد نظر خود را در نوار بالا جستجو کنید تا یک مقاله کامل دریافت کنید.</p>
    </div>
  );
    
  const isBusy = isLoading || disambiguationChoices.length > 0;

  return (
    <div className="min-h-screen text-gray-100 font-semibold font-[Vazirmatn,tahoma]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
        
        body {
          background-color: #1a102c;
          background: linear-gradient(315deg, rgba(26,16,44,1) 0%, rgba(50,25,80,1) 35%, rgba(20,5,50,1) 100%);
          animation: breathing-background 15s ease-in-out infinite alternate;
        }

        @keyframes breathing-background {
          0% {
            background-size: 100% 100%;
            background-position: 0% 50%;
          }
          50% {
            background-size: 120% 120%;
            background-position: 100% 50%;
          }
          100% {
            background-size: 100% 100%;
            background-position: 0% 50%;
          }
        }

        .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .backdrop-blur-sm {
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
        }
      `}</style>
      <header className="sticky top-0 z-10 p-4 bg-black/20 backdrop-blur-sm shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 space-x-reverse self-start sm:self-center">
                <BookOpenIcon className="h-8 w-8 text-purple-400" />
                <h1 className="text-2xl font-bold">کاوشگر ویکی فارسی</h1>
            </div>
            <div className="w-full sm:max-w-md">
              <SearchBar 
                query={query} 
                setQuery={setQuery} 
                onSearch={handleSearch} 
                isLoading={isBusy} 
              />
            </div>
        </div>
      </header>

      <main className="p-4 sm:p-8">
        <div className="mt-2 flex flex-col justify-center items-center space-y-8 px-4">
            {error && <ErrorMessage message={error} />}
            {isLoading && <LoadingSpinner />}
            
            {!isLoading && !error && disambiguationChoices.length > 0 && (
              <DisambiguationChoices 
                choices={disambiguationChoices}
                onSelect={handleTopicSelect}
                query={originalQuery}
              />
            )}

            {!isLoading && !error && article && disambiguationChoices.length === 0 && (
              <ArticleDisplay article={article} onLinkClick={handleTopicSelect} />
            )}

            {!isLoading && !error && !article && disambiguationChoices.length === 0 && (
              <WelcomeScreen />
            )}
        </div>
      </main>
    </div>
  );
};

export default App;