// Helper functions for interacting with our Gemini API endpoints

// Analyze a mock interview recording/transcript
export async function analyzeMockInterview(transcript: string, jobRole?: string): Promise<any> {
  try {
    const response = await fetch('/api/analyze-mock-interview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoTranscript: transcript,
        jobRole,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze mock interview');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing mock interview:', error);
    throw error;
  }
}

// Optimize a resume for a particular job description
export async function optimizeResume(resumeContent: any, jobDescription: string): Promise<any> {
  try {
    const response = await fetch('/api/optimize-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeContent,
        jobDescription,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to optimize resume');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error optimizing resume:', error);
    throw error;
  }
}

// Generate a cover letter
export async function generateCoverLetter(
  resumeContent: any, 
  jobDescription: string, 
  companyName: string
): Promise<string> {
  try {
    console.log('Sending request with:', { resumeContent, jobDescription, companyName });
    
    const response = await fetch('/api/generate-cover-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeContent,
        jobDescription,
        companyName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate cover letter');
    }

    const data = await response.json();
    console.log('Received response:', data);

    // Extract the actual cover letter text
    if (!data || typeof data.coverLetter !== 'string') {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from server');
    }

    return data.coverLetter;
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw error;
  }
}

// Calculate job match score
export async function calculateJobMatchScore(
  resumeContent: any,
  jobDescription: string
): Promise<any> {
  try {
    const response = await fetch('/api/calculate-job-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeContent,
        jobDescription,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to calculate job match score');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calculating job match score:', error);
    throw error;
  }
}

// Generate interview questions
export async function generateInterviewQuestions(
  jobRole: string,
  count: number = 5
): Promise<any> {
  try {
    const response = await fetch('/api/generate-interview-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        jobRole,
        count,
      }),
    });
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response format. Expected JSON but got: ${text.substring(0, 100)}...`);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to generate interview questions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw error;
  }
}

// Fetch AI feedback for interview answers
export async function getAnswerFeedback(
  question: string,
  answer: string,
  jobRole: string
): Promise<any> {
  try {
    const response = await fetch('/api/interview-answer-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        jobRole,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get answer feedback');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting answer feedback:', error);
    throw error;
  }
}