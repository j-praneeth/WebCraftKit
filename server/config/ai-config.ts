import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with API key from environment
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize the model directly
export const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Common model configurations
export const MODEL_CONFIG = {
  DEFAULT: 'gemini-1.5-flash',
  VISION: 'gemini-1.5-flash',
  CHAT: 'gemini-1.5-flash'
};

// Helper function to validate API key
export function validateApiKey(): boolean {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key is not configured");
    return false;
  }
  return true;
}

// Helper function to handle API errors
export function handleApiError(error: any) {
  console.error("Gemini API error:", error);
  
  if (error?.status === 429) {
    return {
      status: 429,
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      details: error.message
    };
  }
  
  if (error?.status === 401) {
    return {
      status: 401,
      error: "Authentication error",
      message: "Invalid API key or unauthorized access",
      details: error.message
    };
  }
  
  return {
    status: 500,
    error: "API error",
    message: "An error occurred while processing your request",
    details: error.message
  };
}

// Helper function to create a model instance
export function getModel(modelName: string = MODEL_CONFIG.DEFAULT) {
  return genAI.getGenerativeModel({ model: modelName });
}