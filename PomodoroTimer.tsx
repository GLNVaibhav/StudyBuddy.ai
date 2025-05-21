
import React, { useState, useEffect, useCallback } from 'react';

const WORK_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes
const SESSIONS_BEFORE_LONG_BREAK = 4;

type TimerMode = 'work' | 'break' | 'longBreak';

export const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(WORK_DURATION);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<TimerMode>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);

  const playSound = useCallback(() => {
    // Basic beep sound; browser support for audio context might be needed for more complex sounds
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContext) return;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
      console.warn("Could not play sound, AudioContext not supported or failed.", e);
    }
  }, []);


  useEffect(() => {
    // Fix: Changed NodeJS.Timeout to number for browser compatibility.
    // setInterval in browsers returns a number, not NodeJS.Timeout.
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      // Fix: Explicitly use window.setInterval to ensure browser type (number) is returned.
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      playSound();
      setIsActive(false);
      if (mode === 'work') {
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        if (newSessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
          setMode('longBreak');
          setTimeLeft(LONG_BREAK_DURATION);
        } else {
          setMode('break');
          setTimeLeft(BREAK_DURATION);
        }
      } else { // break or longBreak finished
        setMode('work');
        setTimeLeft(WORK_DURATION);
      }
    }

    return () => {
      // Fix: Explicitly use window.clearInterval.
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, sessionsCompleted, playSound]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setMode('work');
    setTimeLeft(WORK_DURATION);
    setSessionsCompleted(0);
  }, []);
  
  const skipTimer = useCallback(() => {
    playSound();
    setIsActive(false);
    if (mode === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      if (newSessionsCompleted % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK_DURATION);
      } else {
        setMode('break');
        setTimeLeft(BREAK_DURATION);
      }
    } else { 
      setMode('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [mode, sessionsCompleted, playSound]);


  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getModeText = () => {
    if (mode === 'work') return "Focus Time";
    if (mode === 'break') return "Short Break";
    return "Long Break";
  };
  
  const getModeColor = () => {
    if (mode === 'work') return "bg-sky-600";
    if (mode === 'break') return "bg-green-600";
    return "bg-teal-600";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 rounded-lg shadow-xl bg-slate-800 h-full">
      <div className={`w-full max-w-md p-6 sm:p-10 rounded-xl shadow-2xl ${getModeColor()} text-white`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">{getModeText()}</h2>
        <p className="text-sm text-center text-slate-200 mb-6">Sessions completed: {sessionsCompleted}</p>
        
        <div className="text-6xl sm:text-8xl font-mono font-bold text-center my-8 sm:my-12 tabular-nums">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={toggleTimer}
            className={`w-full sm:w-auto px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-200
              ${isActive 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}
              shadow-md hover:shadow-lg transform hover:scale-105`}
          >
            <i className={`fa-solid ${isActive ? 'fa-pause' : 'fa-play'} mr-2`}></i>
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={skipTimer}
            className="w-full sm:w-auto px-8 py-3 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg text-lg font-semibold transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <i className="fa-solid fa-forward-step mr-2"></i>
            Skip
          </button>
        </div>
        <button
            onClick={resetTimer}
            className="w-full mt-6 text-center text-sm text-slate-300 hover:text-white hover:underline"
          >
            <i className="fa-solid fa-arrows-rotate mr-1"></i> Reset All Cycles
          </button>
      </div>
    </div>
  );
};
