
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getChatAnswer } from '../services/geminiService'; 
import type { Content } from '@google/genai'; // For constructing history correctly
import type { Message, GroundingChunkWeb } from '../types';

interface QnaViewProps {
  contextText: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const AIMessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div className="mb-3 flex justify-start">
    <div className="bg-sky-600 text-white p-3 rounded-lg max-w-xl shadow">
      <p className="whitespace-pre-wrap">{message.text}</p>
      {message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-sky-500">
          <p className="text-xs text-sky-200 font-semibold mb-1">Sources:</p>
          <ul className="list-disc list-inside text-xs">
            {message.groundingMetadata.groundingChunks.map((chunk, idx) => 
              chunk.web && (
                <li key={idx} className="truncate">
                  <a 
                    href={chunk.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sky-100 hover:text-white underline"
                    title={chunk.web.uri}
                  >
                    {chunk.web.title || chunk.web.uri}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  </div>
);

const UserMessageBubble: React.FC<{ message: Message }> = ({ message }) => (
  <div className="mb-3 flex justify-end">
    <div className="bg-slate-700 text-slate-200 p-3 rounded-lg max-w-xl shadow">
      <p className="whitespace-pre-wrap">{message.text}</p>
    </div>
  </div>
);


export const QnaView: React.FC<QnaViewProps> = ({ contextText, setIsLoading, setError }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initializeChatDisplay = useCallback(() => {
     setMessages([{ sender: 'ai', text: "I've read your document. What would you like to ask about it?" }]);
  }, []);


  useEffect(() => {
    if (contextText) {
      initializeChatDisplay(); 
    } else {
      setMessages([]); 
    }
  }, [contextText, initializeChatDisplay]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim()) {
      return;
    }
    if (!contextText) {
        setError("Please upload or provide text context first.");
        return;
    }

    const userMessage: Message = { sender: 'user', text: currentQuestion };
    const newMessages: Message[] = [...messages, userMessage];
    setMessages(newMessages);
    setCurrentQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      // Transform Message[] history to Content[] for the service.
      // Exclude the initial AI message for history if it's just a placeholder.
      const historyForAPI: Content[] = newMessages.slice(0, -1) 
        .filter(msg => !(msg.sender === 'ai' && msg.text === "I've read your document. What would you like to ask about it?")) // Exclude placeholder
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
      }));
      
      const response = await getChatAnswer(contextText, userMessage.text, historyForAPI);
      setMessages([...newMessages, { sender: 'ai', text: response.text, groundingMetadata: response.groundingMetadata }]);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Failed to get an answer.";
      setError(errorMessage);
      setMessages([...newMessages, { sender: 'ai', text: `Sorry, I encountered an error: ${errorMessage.substring(0,100)}...`}]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!contextText) {
    return <div className="p-4 bg-slate-800 rounded-lg shadow-xl text-slate-300">Upload or paste some text first to ask questions about it.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-sky-400 p-4 border-b border-slate-700">Ask Questions</h2>
      <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {messages.map((msg, index) => 
            msg.sender === 'user' ? <UserMessageBubble key={index} message={msg} /> : <AIMessageBubble key={index} message={msg} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
            placeholder="Type your question here..."
            className="flex-grow p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-500"
            disabled={!contextText}
          />
          <button
            onClick={handleAskQuestion}
            disabled={!currentQuestion.trim() || !contextText}
            className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:bg-slate-600 transition-colors"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
