
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on overlay click
      role="dialog" // Added role dialog for accessibility
      aria-modal="true" // Added aria-modal for accessibility
      aria-labelledby={title ? "modal-title" : undefined} // Relate to title if present
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-0 transform transition-all duration-300 ease-in-out scale-95 animate-modalOpen"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal content
      >
        {(title || onClose) && (
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-700">
            {title && <h3 id="modal-title" className="text-xl font-semibold text-sky-400">{title}</h3>}
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-200 transition-colors text-2xl leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        <div className="p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
};
