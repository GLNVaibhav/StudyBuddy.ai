
import React, { useState, useEffect, useCallback } from 'react';
import { generateQuiz } from '../services/geminiService';
import type { QuizQuestion } from '../types';
import { Modal } from './Modal';

interface QuizViewProps {
  contextText: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  // apiKeyPresent prop removed
}

const QuizQuestionDisplay: React.FC<{ question: QuizQuestion; onAnswer: (answer: string) => void; questionNumber: number; totalQuestions: number }> = 
  ({ question, onAnswer, questionNumber, totalQuestions }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    onAnswer(option); 
  };
  
  useEffect(() => {
    setSelectedOption(null);
  }, [question]);

  return (
    <div className="p-6 bg-slate-700 rounded-lg shadow-md">
      <p className="text-sm text-sky-400 mb-1">Question {questionNumber} of {totalQuestions}</p>
      <h3 className="text-xl font-semibold text-slate-100 mb-4">{question.question}</h3>
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(option)}
            className={`w-full text-left p-3 rounded-md border transition-all duration-150
              ${selectedOption === option 
                ? 'bg-sky-500 border-sky-400 text-white ring-2 ring-sky-300' 
                : 'bg-slate-600 border-slate-500 hover:bg-slate-500 hover:border-sky-600 text-slate-200'}
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};


export const QuizView: React.FC<QuizViewProps> = ({ contextText, setIsLoading, setError }) => {
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'finished'>('idle');
  const [score, setScore] = useState<number>(0);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);


  const handleGenerateQuiz = useCallback(async () => {
    if (!contextText) {
      setError("No text provided to generate quiz from.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const generatedQuestions = await generateQuiz(contextText);
      setQuiz(generatedQuestions.map(q => ({...q, userAnswer: undefined})));
      setAnswers(new Array(generatedQuestions.length).fill(''));
      setCurrentQuestionIndex(0);
      setQuizState('active');
      setScore(0);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to generate quiz.");
      setQuiz([]);
      setQuizState('idle');
    } finally {
      setIsLoading(false);
    }
  }, [contextText, setIsLoading, setError]);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);

    const updatedQuiz = [...quiz];
    if (updatedQuiz[currentQuestionIndex]) {
        updatedQuiz[currentQuestionIndex].userAnswer = answer;
        setQuiz(updatedQuiz);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      let currentScore = 0;
      quiz.forEach(q => {
        if (q.userAnswer === q.correctAnswer) {
          currentScore++;
        }
      });
      setScore(currentScore);
      setQuizState('finished');
      setShowResultsModal(true);
    }
  };
  
  const handleRestartQuiz = () => {
    setQuizState('idle');
    setQuiz([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResultsModal(false);
  };
  
  useEffect(() => {
    handleRestartQuiz();
  }, [contextText]);

  if (!contextText && quizState === 'idle') {
    return <div className="p-4 bg-slate-800 rounded-lg shadow-xl text-slate-300">Upload or paste some text first to generate a quiz.</div>;
  }

  return (
    <div className="space-y-6 p-4 rounded-lg shadow-xl bg-slate-800">
      <h2 className="text-2xl font-semibold text-sky-400 border-b border-slate-700 pb-3">Last-Minute Quiz</h2>
      
      {quizState === 'idle' && (
        <button
          onClick={handleGenerateQuiz}
          disabled={!contextText}
          className="w-full px-6 py-3 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:bg-slate-600 transition-colors text-lg font-medium flex items-center justify-center"
        >
          <i className="fa-solid fa-bolt mr-2"></i> Generate Quiz Now
        </button>
      )}

      {quizState === 'active' && quiz.length > 0 && (
        <div className="space-y-6">
          <QuizQuestionDisplay
            question={quiz[currentQuestionIndex]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={quiz.length}
          />
          <button
            onClick={handleNextQuestion}
            disabled={!answers[currentQuestionIndex]}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-600 transition-colors font-medium"
          >
            {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      )}
      
      {showResultsModal && quizState === 'finished' && (
        <Modal isOpen={showResultsModal} onClose={() => setShowResultsModal(false)}>
          <div className="p-6">
            <h3 className="text-2xl font-bold text-sky-400 mb-4">Quiz Results!</h3>
            <p className="text-lg text-slate-200 mb-6">You scored: <strong className="text-green-400 text-2xl">{score}</strong> out of <strong className="text-xl">{quiz.length}</strong></p>
            
            <div className="max-h-60 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
              {quiz.map((q, index) => (
                <div key={index} className={`p-3 rounded-md border ${q.userAnswer === q.correctAnswer ? 'bg-green-900 border-green-700' : 'bg-red-900 border-red-700'}`}>
                  <p className="font-semibold text-slate-200 mb-1 text-sm">{index+1}. {q.question}</p>
                  <p className="text-xs text-slate-400">Your answer: <span className={q.userAnswer === q.correctAnswer ? 'text-green-400' : 'text-red-400'}>{q.userAnswer || "Not answered"}</span></p>
                  {q.userAnswer !== q.correctAnswer && <p className="text-xs text-green-400">Correct answer: {q.correctAnswer}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
               <button 
                onClick={handleRestartQuiz}
                className="px-5 py-2 bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500 transition-colors"
                >
                New Quiz
              </button>
              <button 
                onClick={() => setShowResultsModal(false)}
                className="px-5 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors"
                >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
