
import React, { useState, useEffect, useCallback } from 'react';
import { suggestVideoTopics } from '../services/geminiService';

interface VideoSuggestViewProps {
  text: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // apiKeyPresent prop removed
}

export const VideoSuggestView: React.FC<VideoSuggestViewProps> = ({ text, setIsLoading, setError }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const fetchSuggestions = useCallback(async () => {
    if (!text) {
      // setError("No text provided to suggest videos from."); // Optional
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await suggestVideoTopics(text);
      setSuggestions(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to suggest video topics.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [text, setIsLoading, setError]);

  useEffect(() => {
    if (text) {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [text, fetchSuggestions]);

  if (!text) {
    return <div className="p-4 bg-slate-800 rounded-lg shadow-xl text-slate-300">Upload or paste some text first to get video suggestions.</div>;
  }

  return (
    <div className="space-y-6 p-4 rounded-lg shadow-xl bg-slate-800">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
        <h2 className="text-2xl font-semibold text-sky-400">YouTube Video Topic Suggestions</h2>
        <button
          onClick={fetchSuggestions}
          disabled={!text}
          className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-600 transition-colors text-sm"
        >
          <i className="fa-solid fa-arrows-rotate mr-2"></i> Regenerate
        </button>
      </div>
      
      {suggestions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-slate-300">Here are some topics you can search for on YouTube for helpful videos:</p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-slate-200">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(suggestion)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 hover:underline flex items-center"
                >
                  {suggestion} <i className="fa-solid fa-arrow-up-right-from-square text-xs ml-2"></i>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-slate-400">Generating suggestions... If this takes too long, try with shorter text.</p>
      )}
       <p className="text-xs text-slate-500 pt-2">
        Note: These are search query suggestions. This tool does not directly link to specific videos.
      </p>
    </div>
  );
};
