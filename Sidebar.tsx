
import React from 'react';
import { Feature } from '../constants';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const featureIcons: Record<Feature, string> = {
  [Feature.UPLOAD]: "fa-solid fa-upload",
  [Feature.SUMMARY]: "fa-solid fa-file-lines",
  [Feature.QNA]: "fa-solid fa-comments",
  [Feature.QUIZ]: "fa-solid fa-graduation-cap",
  [Feature.NOTES]: "fa-solid fa-book-open",
  [Feature.VIDEOS]: "fa-brands fa-youtube",
  [Feature.POMODORO]: "fa-solid fa-clock",
};

export const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  return (
    <aside className="w-20 sm:w-64 bg-slate-800 p-2 sm:p-4 space-y-2 sm:space-y-3 flex flex-col items-center sm:items-stretch">
      <h1 className="text-xl sm:text-2xl font-bold text-sky-400 mb-4 sm:mb-6 hidden sm:block text-center">Study AI</h1>
      <div className="sm:hidden text-sky-400 text-2xl mb-6"><i className="fa-solid fa-brain"></i></div>
      {(Object.values(Feature) as Feature[]).map((feature) => (
        <button
          key={feature}
          onClick={() => setActiveFeature(feature)}
          className={`w-full flex items-center justify-center sm:justify-start space-x-0 sm:space-x-3 p-3 rounded-md text-sm sm:text-base transition-all duration-200 ease-in-out
            ${activeFeature === feature ? 'bg-sky-600 text-white shadow-lg transform sm:scale-105' : 'hover:bg-slate-700 text-slate-300 hover:text-sky-300'}
          `}
          title={feature}
        >
          <i className={`${featureIcons[feature]} text-lg sm:text-base`}></i>
          <span className="hidden sm:inline">{feature}</span>
        </button>
      ))}
    </aside>
  );
};
    