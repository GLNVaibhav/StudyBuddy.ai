
import React, { useState, useEffect, useCallback } from 'react';
import { createNotes } from '../services/geminiService';

interface NotesViewProps {
  text: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // apiKeyPresent prop removed
}

export const NotesView: React.FC<NotesViewProps> = ({ text, setIsLoading, setError }) => {
  const [notes, setNotes] = useState<string>('');
  const [topic, setTopic] = useState<string>('');

  const fetchNotes = useCallback(async () => {
    if (!text) {
      // setError("No text provided to generate notes from."); // Optional
      setNotes('');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await createNotes(text, topic || undefined);
      setNotes(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate notes.");
      setNotes('');
    } finally {
      setIsLoading(false);
    }
  }, [text, topic, setIsLoading, setError]);

  useEffect(() => {
    if (text && !notes) { 
      fetchNotes();
    } else if (!text) {
      setNotes('');
    }
  }, [text, notes, fetchNotes]);


  if (!text) {
    return <div className="p-4 bg-slate-800 rounded-lg shadow-xl text-slate-300">Upload or paste some text first to generate notes.</div>;
  }

  return (
    <div className="space-y-6 p-4 rounded-lg shadow-xl bg-slate-800">
      <div className="border-b border-slate-700 pb-3">
        <h2 className="text-2xl font-semibold text-sky-400">Generated Notes</h2>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Optional: Specify a topic to focus on (e.g., 'Chapter 3 summary')"
          className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-400"
        />
        <button
          onClick={fetchNotes}
          disabled={!text}
          className="px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-600 transition-colors whitespace-nowrap"
        >
          <i className="fa-solid fa-arrows-rotate mr-2"></i> Generate / Regenerate Notes
        </button>
      </div>

      {notes ? (
        <div className="prose prose-sm sm:prose-base prose-invert max-w-none p-3 bg-slate-700 rounded-md whitespace-pre-wrap overflow-x-auto">
          {notes}
        </div>
      ) : (
        <p className="text-slate-400">Generating notes... If this takes too long, try with shorter text or a more specific topic.</p>
      )}
    </div>
  );
};
