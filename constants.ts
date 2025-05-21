
export enum Feature {
  UPLOAD = 'Upload Material',
  SUMMARY = 'Summarize Text',
  QNA = 'Q&A',
  QUIZ = 'Generate Quiz',
  NOTES = 'Create Notes',
  VIDEOS = 'Suggest Videos',
  POMODORO = 'Pomodoro Timer',
}

export const API_KEY_WARNING = "API_KEY environment variable is not set. AI features will be disabled. Please set this variable and restart the application.";

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
    