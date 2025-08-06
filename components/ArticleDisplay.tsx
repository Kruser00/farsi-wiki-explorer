import React from 'react';
import type { Article } from '../types';

interface ArticleDisplayProps {
  article: Article;
  onLinkClick: (topic: string) => void;
}

const parseLineForLinks = (line: string, onLinkClick: (topic: string) => void, lineKey: string | number) => {
    // Regex to split by [[...]] but keep the delimiters
    const parts = line.split(/(\[\[.*?\]\])/g);

    return parts.map((part, index) => {
        const match = part.match(/^\[\[(.*?)\]\]$/);
        if (match) {
            const topic = match[1];
            return (
                <button
                    key={`${lineKey}-${index}`}
                    onClick={() => onLinkClick(topic)}
                    className="text-purple-400 hover:text-purple-300 hover:underline focus:outline-none focus:underline font-semibold transition-colors bg-transparent border-none p-0 m-0 cursor-pointer"
                >
                    {topic}
                </button>
            );
        }
        // Return text part, ensuring it has a key
        return <React.Fragment key={`${lineKey}-${index}`}>{part}</React.Fragment>;
    });
}

const renderContentWithLinks = (content: string, onLinkClick: (topic: string) => void) => {
  if (!content) return null;

  // Preserve line breaks by splitting and mapping
  const lines = content.split('\n');
  
  return lines.map((line, lineIndex) => (
    // We use a div for each line to preserve block structure, and React.Fragment for the key on the line itself.
    <div key={lineIndex}>
      {parseLineForLinks(line, onLinkClick, lineIndex)}
    </div>
  ));
};


const ArticleDisplay: React.FC<ArticleDisplayProps> = ({ article, onLinkClick }) => {
  return (
    <div className="w-full max-w-3xl mx-auto bg-black/30 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden animate-fade-in border border-purple-400/20">
      <div className="p-4 sm:p-8">
        <h1 className="text-4xl font-bold text-white mb-6 capitalize text-center border-b-2 border-purple-400/50 pb-4">
          {article.title}
        </h1>
        
        {article.content ? (
            <div 
                className="prose prose-lg max-w-none text-right text-gray-200 space-y-4 leading-loose mt-6"
            >
              {renderContentWithLinks(article.content, onLinkClick)}
            </div>
        ) : (
            <div className="flex flex-col justify-center items-center py-16 text-center">
                <div className="w-12 h-12 border-4 border-purple-400 border-solid rounded-full animate-spin border-t-transparent"></div>
                <p className="mt-4 text-lg text-gray-400">...در حال نوشتن مقاله</p>
            </div>
        )}
        
        {article.sources.length > 0 && (
          <div className="mt-12 pt-6 border-t border-purple-400/20">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">
              منابع
            </h2>
            <ul className="space-y-2 list-disc list-inside">
              {article.sources.map((source, index) => (
                <li key={index} className="text-gray-300">
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {source.title || source.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleDisplay;