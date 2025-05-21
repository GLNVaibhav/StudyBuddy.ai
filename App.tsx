
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { FileUploadView } from './components/FileUploadView';
import { SummaryView } from './components/SummaryView';
import { QnaView } from './components/QnaView';
import { QuizView } from './components/QuizView';
import { NotesView } from './components/NotesView';
import { VideoSuggestView } from './components/VideoSuggestView';
import { PomodoroTimer } from './components/PomodoroTimer';
import { Feature } from './constants';
// API_KEY_WARNING is no longer directly applicable as key is server-side
// import { API_KEY_WARNING } from './constants'; 

const App: React.FC = () => {
  // apiKeyPresent state is removed as key is handled by backend proxy
  const [uploadedText, setUploadedText] = useState<string>('');
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.UPLOAD);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // The direct API key check useEffect is removed.
  // We assume the proxy is set up. If not, API calls will fail and show an error.

  const handleTextUploaded = useCallback((text: string) => {
    setUploadedText(text);
    setActiveFeature(Feature.SUMMARY); // Default to summary after upload
    setError(null);
  }, []);

  const renderFeatureContent = () => {
    // The check for apiKeyPresent is removed. Features will attempt to call the proxy.
    // If proxy is not set up or API key is missing on server, service calls will throw errors.
    switch (activeFeature) {
      case Feature.UPLOAD:
        return <FileUploadView onTextUploaded={handleTextUploaded} setIsLoading={setIsLoading} setError={setError} />;
      case Feature.SUMMARY:
        return <SummaryView text={uploadedText} setIsLoading={setIsLoading} setError={setError} />;
      case Feature.QNA:
        return <QnaView contextText={uploadedText} setIsLoading={setIsLoading} setError={setError} />;
      case Feature.QUIZ:
        return <QuizView contextText={uploadedText} setIsLoading={setIsLoading} setError={setError} />;
      case Feature.NOTES:
        return <NotesView text={uploadedText} setIsLoading={setIsLoading} setError={setError} />;
      case Feature.VIDEOS:
        return <VideoSuggestView text={uploadedText} setIsLoading={setIsLoading} setError={setError} />;
      case Feature.POMODORO:
        return <PomodoroTimer />;
      default:
        return <FileUploadView onTextUploaded={handleTextUploaded} setIsLoading={setIsLoading} setError={setError} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-sky-500"></div>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-md shadow-lg">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="mt-2 text-sm underline">Dismiss</button>
          </div>
        )}
        <div className="max-w-4xl mx-auto">
         {renderFeatureContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
