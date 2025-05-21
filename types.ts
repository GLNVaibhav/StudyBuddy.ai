
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string; 
}

// Grounding metadata can be complex, this is a simplified version for web chunks
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // other types of chunks could exist
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // other metadata fields if needed
}

export interface Message {
  sender: 'user' | 'ai';
  text: string;
  groundingMetadata?: GroundingMetadata;
}

    