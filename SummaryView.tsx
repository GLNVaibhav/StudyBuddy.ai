
import React, { useState, useEffect, useCallback } from 'react';
import { summarizeText } from '../services/geminiService';

interface SummaryViewProps {
  text: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // apiKeyPresent prop removed
}

export const SummaryView: React.FC<SummaryViewProps> = ({ text, setIsLoading, setError }) => {
  const [summary, setSummary] = useState<string>('');

  const fetchSummary = useCallback(async () => {
    if (!text) {
      // setError("No text provided to summarize."); // Optional: or just clear summary
      setSummary('');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await summarizeText(text);
      setSummary(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate summary.");
      setSummary('');
    } finally {
      setIsLoading(false);
    }
  }, [text, setIsLoading, setError]);

  useEffect(() => {
    if (text) {
      fetchSummary();
    } else {
      setSummary(''); 
    }
  }, [text, fetchSummary]);


  if (!text) {
    return <div className="p-4 bg-slate-800 rounded-lg shadow-xl text-slate-300">Upload or paste some text first to get a summary.</div>;
  }
  
  return (
    <div className="space-y-6 p-4 rounded-lg shadow-xl bg-slate-800">
      <div className="flex justify-between items-center border-b border-slate-700 pb-3">
        <h2 className="text-2xl font-semibold text-sky-400">Generated Summary</h2>
        <button
          onClick={fetchSummary}
          disabled={!text}
          className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-600 transition-colors text-sm"
        >
          <i className="fa-solid fa-arrows-rotate mr-2"></i> Regenerate
        </button>
      </div>
      {summary ? (
        <div className="prose prose-sm sm:prose-base prose-invert max-w-none p-3 bg-slate-700 rounded-md whitespace-pre-wrap overflow-x-auto">
          {summary}
        </div>
      ) : (
        <p className="text-slate-400">Generating summary... If this takes too long, try with shorter text.</p>
      )}
    </div>
  );
};
