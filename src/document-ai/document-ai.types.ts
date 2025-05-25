export interface ProcessedResult {
  text: string;
  confidence: number;
  boundingBox?: Array<{ x: number; y: number }>;
}

export interface DocumentAiResponse {
  results: ProcessedResult[];
}
