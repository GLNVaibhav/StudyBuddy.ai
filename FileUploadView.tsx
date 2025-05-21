
import React, { useState, useCallback } from 'react';
import { uploadAndExtractTextFromFile } from '../services/geminiService'; // New service import

interface FileUploadViewProps {
  onTextUploaded: (text: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const FileUploadView: React.FC<FileUploadViewProps> = ({ onTextUploaded, setIsLoading, setError }) => {
  const [pastedText, setPastedText] = useState<string>('');

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        // Read file as Base64 to send to backend for parsing
        const reader = new FileReader();
        reader.onload = async (loadEvent) => {
          if (loadEvent.target?.result) {
            const base64FileData = (loadEvent.target.result as string).split(',')[1]; // Get Base64 part
            try {
              const extractedText = await uploadAndExtractTextFromFile(file.name, base64FileData);
              onTextUploaded(extractedText);
              setPastedText(extractedText); // Optionally show extracted text in textarea
            } catch (extractErr) {
              console.error("Error extracting text via proxy:", extractErr);
              setError(extractErr instanceof Error ? extractErr.message : "Failed to extract text from file via server.");
            } finally {
              setIsLoading(false);
            }
          } else {
            setError("Could not read file data.");
            setIsLoading(false);
          }
        };
        reader.onerror = () => {
          console.error("FileReader error");
          setError("Error reading file.");
          setIsLoading(false);
        };
        reader.readAsDataURL(file); // Reads as Base64 Data URL
      } catch (err) {
        console.error("Error preparing file for upload:", err);
        setError("Failed to prepare the file for processing.");
        setIsLoading(false);
      }
    }
    event.target.value = ''; // Reset file input
  }, [onTextUploaded, setIsLoading, setError]);

  const handleSubmitPastedText = useCallback(() => {
    setError(null);
    if (pastedText.trim()) {
      onTextUploaded(pastedText.trim());
    } else {
      setError("Please paste some text or upload a file.");
    }
  }, [pastedText, onTextUploaded, setError]);

  return (
    <div className="space-y-6 p-4 rounded-lg shadow-xl bg-slate-800">
      <h2 className="text-2xl font-semibold text-sky-400 border-b border-slate-700 pb-3">Upload Your Study Material</h2>
      
      <div className="space-y-3">
        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300">
          Upload a file (TXT, PDF, DOCX, PPTX, XLSX):
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md hover:border-sky-500 transition-colors">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="flex text-sm text-slate-400">
              <label
                htmlFor="file-upload-input"
                className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-sky-400 hover:text-sky-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-sky-500 px-2 py-1"
              >
                <span>Upload a file</span>
                <input 
                  id="file-upload-input" 
                  name="file-upload" 
                  type="file" 
                  className="sr-only" 
                  accept=".txt,.pdf,.docx,.pptx,.xlsx" 
                  onChange={handleFileChange} 
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-slate-500">TXT, PDF, DOCX, PPTX, XLSX files supported.</p>
          </div>
        </div>
      </div>

      <div className="text-center text-slate-400 my-4">OR</div>

      <div className="space-y-3">
        <label htmlFor="pasted-text" className="block text-sm font-medium text-slate-300">
          Paste your text content:
        </label>
        <textarea
          id="pasted-text"
          rows={10}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-500"
          placeholder="Paste your notes, lecture transcript, or any text here... (or upload a file above)"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
      </div>
      
      <button
        onClick={handleSubmitPastedText}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-transform hover:scale-105"
      >
        <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i> Process Pasted Text
      </button>
      <p className="text-xs text-slate-500 text-center pt-2">
        Note: Text extraction quality may vary for complex PDFs or PPTs. Large files may take longer to process.
      </p>
    </div>
  );
};