
import type { QuizQuestion, GroundingMetadata, Message } from '../types';
import type { Content } from '@google/genai'; // For constructing history

// The path to your serverless function on Netlify.
const PROXY_ENDPOINT = '/.netlify/functions/gemini-proxy'; 

const parseJsonFromTextClient = <T,>(text: string): T | null => {
  // This client-side parser is a fallback or for when server explicitly sends text that needs parsing
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("CLIENT: Failed to parse JSON from text:", e, "Original text:", text);
    return null;
  }
};

async function callProxy<T>(action: string, data: any): Promise<T> {
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { error: await response.text() || `HTTP error! status: ${response.status}` };
      }
      console.error(`Proxy call failed for action ${action}:`, response.status, errorBody);
      throw new Error(errorBody.error || `Proxy request failed with status ${response.status}`);
    }
    const responseData = await response.json();
    return responseData as T;

  } catch (error) {
    console.error(`Error calling proxy for action ${action}:`, error);
    if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error("Network error or proxy not found. Ensure the proxy endpoint is correct and the server is running.");
    }
    throw error; // Re-throw to be caught by UI
  }
}

export const uploadAndExtractTextFromFile = async (fileName: string, fileData: string): Promise<string> => {
  const response = await callProxy<{ extractedText: string }>('extractTextFromFile', { fileName, fileData });
  return response.extractedText;
};

export const summarizeText = async (text: string): Promise<string> => {
  const response = await callProxy<{ summary: string }>('summarizeText', { text });
  return response.summary;
};

export const getChatAnswer = async (
    contextText: string,
    question: string,
    chatHistory: Content[] // Changed from Part[] to Content[]
    ): Promise<{ text: string; groundingMetadata?: GroundingMetadata }> => {
  const response = await callProxy<{ text: string; groundingMetadata?: GroundingMetadata }>(
    'answerQuestion', 
    { contextText, question, chatHistory }
  );
  return response;
};


export const generateQuiz = async (contextText: string): Promise<QuizQuestion[]> => {
  const response = await callProxy<{ quiz: QuizQuestion[] }>('generateQuiz', { contextText });
  if (!response.quiz || !Array.isArray(response.quiz)) {
      console.error("Invalid quiz format received from proxy:", response);
      throw new Error("Proxy returned an invalid quiz format.");
  }
  return response.quiz;
};

export const createNotes = async (text: string, topic?: string): Promise<string> => {
  const response = await callProxy<{ notes: string }>('createNotes', { text, topic });
  return response.notes;
};

export const suggestVideoTopics = async (text: string): Promise<string[]> => {
  const response = await callProxy<{ suggestions: string[] }>('suggestVideoTopics', { text });
   if (!response.suggestions || !Array.isArray(response.suggestions)) {
      console.error("Invalid video suggestions format received from proxy:", response);
      if (typeof (response as any) === 'string') {
          const parsed = parseJsonFromTextClient<string[]>((response as any));
          if (parsed) return parsed;
      }
      throw new Error("Proxy returned an invalid format for video suggestions.");
    }
  return response.suggestions;
};

export const getApiKeyStatus = (): boolean => {
  return true; // Assume proxy will handle auth.
};