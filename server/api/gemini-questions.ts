import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { exponentialDelay } from '../utils';

const router = Router();

// Maximum number of retries for Gemini API calls
const MAX_RETRIES = 3;

// Initialize Gemini with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Define interfaces for type safety
interface Question {
  question: string;
  type: 'technical' | 'behavioral';
  suggestedAnswer: string;
}

interface GeminiResponse {
  questions: Question[];
}

interface TransformedQuestion {
  question: string;
  suggestedAnswer: string;
  category: string;
}

interface TransformedResponse {
  behavioral: TransformedQuestion[];
  technical: TransformedQuestion[];
}

interface RequestBody {
  jobRole: string;
  count: number;
  userId?: number;
  userld?: number;
  [key: string]: any; // Allow other properties
}

// Direct route implementation
router.post('/generate-interview-questions', (req: any, res: any) => {
  try {
    // CRITICAL FIX: Create a completely new request body with only the needed fields
    const requestBody: RequestBody = {
      jobRole: req.body.jobRole,
      count: req.body.count || 5
    };
    
    // Add userld as a number if it exists
    if (req.body.userId !== undefined || req.body.userld !== undefined) {
      const userId = req.body.userId !== undefined ? req.body.userId : req.body.userld;
      const parsedId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      
      if (!isNaN(parsedId)) {
        // Add both variants to ensure compatibility
        requestBody.userld = parsedId; // With lowercase L
        requestBody.userId = parsedId; // With lowercase i
      }
    }
    
    // Replace the original request body completely
    req.body = requestBody;
    
    // Validate essential fields
    if (!req.body.jobRole) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Job role is required'
      });
    }
    
    // Continue with Gemini API call
    let retryCount = 0;
    
    // Define attemptGeminiCall outside the main function to avoid strict mode issues
    const attemptGeminiCall = () => {
      // Set proper content type header
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `You are an expert technical interviewer for ${req.body.jobRole} positions. Generate ${req.body.count} challenging but fair interview questions that assess both technical skills and problem-solving ability. Format your response as a JSON array with exactly ${req.body.count} questions. Each question must have these fields: question (string), type (either "technical" or "behavioral"), and suggestedAnswer (string). Example format: {"questions":[{"question":"...","type":"technical","suggestedAnswer":"..."}]}. Ensure the response is valid JSON.`;
      
      model.generateContent(prompt)
        .then(result => {
          // const response = result.response;
          // const content = response.text();
          
          // if (!content) {
          //   throw new Error('No content received from Gemini');
          // }

            const response = result.response;
            const rawContent = response.text();

            if (!rawContent) {
              throw new Error('No content received from Gemini');
            }
          
          // Clean and parse the response
          // After receiving Gemini's response, strip markdown code block markers before parsing

          // Clean and parse the response
          const cleanContent = rawContent.replace(/```[a-zA-Z]*|```/g, "").trim();
          let questions: GeminiResponse | null = null;
          try {
            questions = JSON.parse(cleanContent) as GeminiResponse;
          } catch (jsonErr) {
            // Attempt to extract JSON substring if parsing fails
            const match = cleanContent.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                questions = JSON.parse(match[0]) as GeminiResponse;
              } catch (jsonErr2) {
                throw new Error('Failed to parse Gemini response as JSON.');
              }
            } else {
              throw new Error('Gemini response did not contain valid JSON.');
            }
          }

          // const cleanJson = rawResponse.replace(/```[a-zA-Z]*|```/g, "").trim();
          // const parsed = JSON.parse(cleanJson);
          // let questions: GeminiResponse | null = null;
          // try {
          //   questions = JSON.parse(cleanContent) as GeminiResponse;
          // } catch (jsonErr) {
          //   // Attempt to extract JSON substring if parsing fails
          //   const match = cleanContent.match(/\{[\s\S]*\}/);
          //   if (match) {
          //     try {
          //       questions = JSON.parse(match[0]) as GeminiResponse;
          //     } catch (jsonErr2) {
          //       throw new Error('Failed to parse Gemini response as JSON.');
          //     }
          //   } else {
          //     throw new Error('Gemini response did not contain valid JSON.');
          //   }
          // }
          // Validate response structure
          if (!questions || !questions.questions || !Array.isArray(questions.questions)) {
            throw new Error('Invalid response structure from Gemini');
          }
          
          // Transform the response to match client expectations
          const transformedResponse: TransformedResponse = {
            behavioral: [] as TransformedQuestion[],
            technical: [] as TransformedQuestion[]
          };
          
          // Sort questions into behavioral and technical categories
          questions.questions.forEach((q: Question) => {
            const category = q.type === 'behavioral' ? 'behavioral' : 'technical';
            const transformed: TransformedQuestion = {
              question: q.question,
              suggestedAnswer: q.suggestedAnswer,
              category: category
            };
            
            if (category === 'behavioral') {
              transformedResponse.behavioral.push(transformed);
            } else {
              transformedResponse.technical.push(transformed);
            }
          });
          
          // Send the transformed JSON response
          res.json(transformedResponse);
        })
        .catch((error: any) => {
          // Handle rate limit errors with retry logic
          if (error?.status === 429 && retryCount < MAX_RETRIES) {
            const delay = exponentialDelay(retryCount);
            console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            retryCount++;
            
            setTimeout(() => {
              attemptGeminiCall();
            }, delay);
            return;
          }
          
          // Handle other errors
          console.error('Error generating interview questions:', error);
          
          if (error?.status === 429) {
            res.status(429).json({
              error: 'Rate limit exceeded',
              message: 'The service is temporarily unavailable due to high demand. Please try again later.'
            });
          } else {
            res.status(500).json({
              error: 'Failed to generate interview questions',
              message: error instanceof Error ? error.message : 'An unknown error occurred'
            });
          }
        });
    };
    
    // Start the initial attempt
    attemptGeminiCall();
    
  } catch (outerError) {
    console.error('Outer error in generate-interview-questions route:', outerError);
    res.status(500).json({
      error: 'Internal server error',
      message: outerError instanceof Error ? outerError.message : 'An unknown error occurred'
    });
  }
});

export default router;