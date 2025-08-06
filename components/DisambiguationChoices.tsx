import React from 'react';
import type { DisambiguationChoice } from '../types';

interface DisambiguationChoicesProps {
  choices: DisambiguationChoice[];
  onSelect: (topic: string) => void;
  query: string;
}

const DisambiguationChoices: React.FC<DisambiguationChoicesProps> = ({ choices, onSelect, query }) => {
  return (
    <div className="w-full max-w-2xl mx-auto bg-black/30 backdrop-blur-sm rounded-xl shadow-2xl p-6 animate-fade-in border border-purple-400/20">
      <h2 className="text-2xl font-bold text-center text-white mb-4">
        منظور شما کدام است؟
      </h2>
      <p className="text-center text-gray-300 mb-6">
        عبارت <span className="font-bold text-purple-300">"{query}"</span> می‌تواند به موارد زیر اشاره داشته باشد:
      </p>
      <ul className="space-y-3">
        {choices.map((choice, index) => (
          <li key={index}>
            <button
              onClick={() => onSelect(choice.topic)}
              className="w-full text-right p-4 rounded-lg bg-white/5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200"
              aria-label={`انتخاب ${choice.topic}`}
            >
              <p className="font-bold text-lg text-purple-300">{choice.topic}</p>
              <p className="text-gray-300">{choice.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DisambiguationChoices;