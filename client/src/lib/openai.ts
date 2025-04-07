import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// In client-side Vite apps, we need to use the API through a backend proxy
// to avoid exposing API keys in the frontend
const makeApiRequest = async (endpoint: string, data: any) => {
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  
  return response.json();
};

// Resume optimization
export async function optimizeResume(resumeContent: any, jobDescription: string): Promise<{
  optimizedContent: any,
  atsScore: number,
  suggestions: string[]
}> {
  try {
    const result = await makeApiRequest('optimize-resume', {
      resumeContent,
      jobDescription
    });
    
    return {
      optimizedContent: result.optimizedContent || resumeContent,
      atsScore: result.atsScore || 70,
      suggestions: result.suggestions || []
    };
  } catch (error) {
    console.error("Error optimizing resume:", error);
    throw new Error("Failed to optimize resume. Please try again later.");
  }
}

// Cover letter generation
export async function generateCoverLetter(resumeContent: any, jobDescription: string, companyName: string): Promise<string> {
  try {
    const result = await makeApiRequest('generate-cover-letter', {
      resumeContent,
      jobDescription,
      companyName
    });

    return result.coverLetter || '';
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter. Please try again later.");
  }
}

// Interview question prediction
export async function predictInterviewQuestions(
  resumeContent: any, 
  jobTitle: string
): Promise<{
  behavioral: { question: string, suggestedAnswer: string }[],
  technical: { question: string, suggestedAnswer: string }[]
}> {
  try {
    const result = await makeApiRequest('predict-interview-questions', {
      resumeContent,
      jobTitle
    });
    
    return {
      behavioral: result.behavioral || [],
      technical: result.technical || []
    };
  } catch (error) {
    console.error("Error predicting interview questions:", error);
    throw new Error("Failed to predict interview questions. Please try again later.");
  }
}

// Mock interview analysis
export async function analyzeMockInterview(videoTranscript: string): Promise<{
  score: number,
  feedback: {
    strengths: string[],
    improvements: string[],
    overall: string
  }
}> {
  try {
    const result = await makeApiRequest('analyze-mock-interview', {
      videoTranscript
    });
    
    return {
      score: result.score || 70,
      feedback: {
        strengths: result.feedback?.strengths || [],
        improvements: result.feedback?.improvements || [],
        overall: result.feedback?.overall || "No feedback available"
      }
    };
  } catch (error) {
    console.error("Error analyzing mock interview:", error);
    throw new Error("Failed to analyze interview. Please try again later.");
  }
}

// Job matching score calculation
export async function calculateJobMatchScore(resumeContent: any, jobDescription: string): Promise<{
  score: number,
  missingKeywords: string[],
  matchingKeywords: string[]
}> {
  try {
    const result = await makeApiRequest('calculate-job-match', {
      resumeContent,
      jobDescription
    });
    
    return {
      score: result.score || 70,
      missingKeywords: result.missingKeywords || [],
      matchingKeywords: result.matchingKeywords || []
    };
  } catch (error) {
    console.error("Error calculating job match score:", error);
    throw new Error("Failed to calculate job match score. Please try again later.");
  }
}
