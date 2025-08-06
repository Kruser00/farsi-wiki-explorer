import React from 'react';
import SearchIcon from './icons/SearchIcon';

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="...موضوع خود را جستجو کنید"
        disabled={isLoading}
        className="w-full px-4 py-3 pr-4 text-lg text-white bg-black/20 border-2 border-purple-400/50 rounded-lg shadow-md focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:outline-none placeholder-gray-400"
      />
      <button
        onClick={onSearch}
        disabled={isLoading}
        className="absolute inset-y-0 left-0 flex items-center justify-center w-14 h-full text-purple-300 hover:text-white disabled:text-gray-500 transition-colors duration-200"
        aria-label="Search"
      >
        <SearchIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default SearchBar;