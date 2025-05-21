// Fix: Add Node.js type reference to resolve 'Cannot find name Buffer' error
/// <reference types="node" />

// This file would typically be in `netlify/functions/gemini-proxy.ts` or `api/gemini-proxy.ts`
// Ensure `@google/genai` is in your package.json for the serverless environment.

import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import type { QuizQuestion, GroundingMetadata } from '../types'; // Assuming types.ts is accessible relative to function

// Import file parsing libraries
import pdf from 'pdf-parse'; // pdf-parse exports default
import mammoth from 'mammoth'; // mammoth exports default
import pptxParser from 'pptx-parser'; // pptx-parser exports default
import * as XLSX from 'xlsx'; // xlsx has namespace export


const API_KEY = process.env.API_KEY;
const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  // This log is crucial for debugging on Netlify.
  console.error("FATAL: Gemini API Key (API_KEY) is not configured in the Netlify function environment. Go to Site settings > Build & deploy > Environment, and set API_KEY.");
}

const parseJsonFromText = <T,>(text: string): T | null => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("PROXY: Failed to parse JSON response:", e, "Original text:", text);
    return null; 
  }
};

interface ProxyRequestPayload {
  action: string;
  data: any;
}

interface ProxyResponse {
  status: number;
  body: any;
}

async function handleGeminiRequest(payload: ProxyRequestPayload): Promise<ProxyResponse> {
  if (!ai && payload.action !== 'extractTextFromFile') { // AI not needed for file extraction
    // This message will be sent to the client if API_KEY is missing.
    return { status: 503, body: { error: "AI Service Not Initialized. The API_KEY is likely missing on the server. Please check server logs." } };
  }

  const { action, data } = payload;

  try {
    let geminiResponse: GenerateContentResponse;
    let resultBody: any;

    switch (action) {
      case 'extractTextFromFile':
        if (!data.fileName || !data.fileData) {
          return { status: 400, body: { error: "Missing fileName or fileData for extraction." } };
        }
        try {
          const fileBuffer = Buffer.from(data.fileData, 'base64');
          const fileName = data.fileName.toLowerCase();
          let extractedText = '';

          if (fileName.endsWith('.pdf')) {
            const pdfData = await pdf(fileBuffer);
            extractedText = pdfData.text;
          } else if (fileName.endsWith('.docx')) {
            const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = docxResult.value;
          } else if (fileName.endsWith('.pptx')) {
            // pptx-parser might need a file path, or can handle buffer. Check its docs.
            // For simplicity, if it expects a path, this approach needs adjustment
            // (e.g. writing to /tmp in serverless, then parsing).
            // Let's assume it can handle a buffer or adapt if necessary.
            // pptx-parser seems to work with buffer if provided as `data: buffer`
            // However, the library is quite basic.
             try {
                const pptxData = await pptxParser.parse(fileBuffer); // Or pptxParser.parse({data: fileBuffer})
                if (pptxData && pptxData.slides) {
                   extractedText = pptxData.slides.map((slide: any) => slide.text || '').join('\n\n');
                } else if (pptxData && typeof pptxData === 'string') { // some versions might return string
                   extractedText = pptxData;
                } else {
                    extractedText = ""; // Default if structure is unexpected
                }
             } catch (pptxError: any) {
                 console.error("PROXY: Error parsing PPTX:", pptxError);
                 // Try to get any text that might have been partially extracted if library supports partial data on error
                 if (pptxError && typeof pptxError.value === 'string') extractedText = pptxError.value;
                 else throw new Error(`Failed to parse PPTX file: ${pptxError.message}`);
             }

          } else if (fileName.endsWith('.xlsx')) {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              // Convert sheet to text, simple approach: join all cell values
              const sheetText = XLSX.utils.sheet_to_txt(worksheet, { strip: true, FS: ' ', RS: '\n' });
              extractedText += sheetText + '\n\n';
            });
          } else if (fileName.endsWith('.txt')) {
            extractedText = fileBuffer.toString('utf-8');
          } else {
            return { status: 400, body: { error: `Unsupported file type: ${fileName.split('.').pop()}` } };
          }
          resultBody = { extractedText: extractedText.trim() };

        } catch (extractError: any) {
          console.error(`PROXY: Error extracting text from file ${data.fileName}:`, extractError);
          return { status: 500, body: { error: `Failed to extract text from file: ${extractError.message}` } };
        }
        break;

      case 'summarizeText':
        if (!data.text) return { status: 400, body: { error: "Missing text for summarization." } };
        geminiResponse = await ai!.models.generateContent({ // Added non-null assertion as AI is checked above for this case
          model: GEMINI_MODEL_TEXT,
          contents: `Summarize the following text for a student preparing for an exam. Focus on key concepts and main points. The summary should be detailed yet concise to save time:\n\n${data.text}`,
        });
        resultBody = { summary: geminiResponse.text };
        break;

      case 'answerQuestion':
        if (!data.contextText || !data.question || !data.chatHistory) { // chatHistory is expected to be Content[]
            return { status: 400, body: { error: "Missing contextText, question, or chatHistory for Q&A." } };
        }
        
        const systemInstruction = `You are an AI assistant. The user has provided a document. Your task is to answer the user's questions based *solely* on the content of this document and the ongoing conversation history.
Do not use any external knowledge or information not present in the provided document text.
If the answer cannot be found within the document or the conversation history, explicitly state that the information is not available in the provided materials.
The document context is:
---START OF DOCUMENT---
${data.contextText}
---END OF DOCUMENT---
`;
        
        const conversationHistory: Content[] = [
          ...(data.chatHistory as Content[]), 
          { role: "user", parts: [{ text: data.question }] }
        ];

        geminiResponse = await ai!.models.generateContent({ // Added non-null assertion
          model: GEMINI_MODEL_TEXT,
          contents: conversationHistory,
           config: {
             systemInstruction: systemInstruction 
           }
        });
        resultBody = { 
            text: geminiResponse.text, 
            groundingMetadata: geminiResponse.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined 
        };
        break;

      case 'generateQuiz':
        if (!data.contextText) return { status: 400, body: { error: "Missing contextText for quiz generation." } };
        geminiResponse = await ai!.models.generateContent({ // Added non-null assertion
          model: GEMINI_MODEL_TEXT,
          contents: `Generate a quiz with 5 multiple-choice questions based on the following text. Each question should have exactly 4 options, and one option must be the correct answer. Return the quiz as a JSON array. Each object in the array should have the following fields: "question" (string), "options" (array of 4 strings), and "correctAnswer" (string, which must be one of the provided options). Ensure the JSON is valid.\n\nText context:\n${data.contextText}`,
          config: { responseMimeType: "application/json" }
        });
        const parsedQuiz = parseJsonFromText<QuizQuestion[]>(geminiResponse.text);
        if (!parsedQuiz) {
            console.error(`PROXY: AI returned non-JSON or malformed JSON for quiz. Raw: ${geminiResponse.text.substring(0,500)}`);
            throw new Error(`The AI returned an unexpected format for the quiz. Please try again. If the problem persists, the content might be too complex for quiz generation in the required format.`);
        }
        resultBody = { quiz: parsedQuiz };
        break;

      case 'createNotes':
        if (!data.text) return { status: 400, body: { error: "Missing text for notes creation." } };
        let notesPrompt = `Generate detailed yet summarized study notes from the following text. The notes should be well-structured, focusing on key definitions, concepts, and important facts.`;
        if (data.topic) {
          notesPrompt += ` Pay special attention to aspects related to "${data.topic}".`;
        }
        notesPrompt += `\n\nText:\n${data.text}`;
        geminiResponse = await ai!.models.generateContent({ // Added non-null assertion
          model: GEMINI_MODEL_TEXT,
          contents: notesPrompt,
        });
        resultBody = { notes: geminiResponse.text };
        break;

      case 'suggestVideoTopics':
        if (!data.text) return { status: 400, body: { error: "Missing text for video suggestions." } };
        geminiResponse = await ai!.models.generateContent({ // Added non-null assertion
          model: GEMINI_MODEL_TEXT,
          contents: `Based on the key concepts in the following text, suggest 3 to 5 YouTube search queries for finding helpful video tutorials. Provide only the search queries as a JSON array of strings. For example: ["how to learn X", "Y explained simply", "introduction to Z"].\n\nText:\n${data.text}`,
          config: { responseMimeType: "application/json" }
        });
        const parsedSuggestions = parseJsonFromText<string[]>(geminiResponse.text);
         if (!parsedSuggestions) {
            console.error(`PROXY: AI returned non-JSON or malformed JSON for video suggestions. Raw: ${geminiResponse.text.substring(0,500)}`);
            throw new Error(`The AI returned an unexpected format for video suggestions. Please try again.`);
        }
        resultBody = { suggestions: parsedSuggestions };
        break;

      default:
        return { status: 400, body: { error: `Invalid action: ${action}` } };
    }
    return { status: 200, body: resultBody };

  } catch (error) {
    console.error(`PROXY ERROR (action: ${action}):`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred on the server.";
    return { status: 500, body: { error: errorMessage, details: error.toString() } };
  }
}


// --- Platform-Specific Handler Export ---

// For Netlify Functions (e.g., netlify/functions/gemini-proxy.ts)
export const handler = async (event: any, context: any) => {
  // API_KEY check is now inside handleGeminiRequest for relevant actions
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const payload = JSON.parse(event.body || '{}');
    const result = await handleGeminiRequest(payload);
    return { statusCode: result.status, body: JSON.stringify(result.body) };
  } catch (e: any) {
    console.error("Netlify handler error:", e);
    return { statusCode: 400, body: JSON.stringify({ error: "Bad Request: " + e.message }) };
  }
};

console.log("Gemini Proxy (Netlify variant) Loaded with File Extraction. API Key status:", API_KEY ? "Found" : "NOT FOUND");