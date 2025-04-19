// import { Router } from 'express';
// import { genAI, MODEL_CONFIG, handleApiError, validateApiKey } from '../config/ai-config';
// import { exponentialDelay } from '../utils';

// const router = Router();

// // Maximum number of retries for Gemini API calls
// const MAX_RETRIES = 3;

// router.post('/generate-interview-questions', async (req, res) => {
//   let retryCount = 0;
  
//   async function attemptGeminiCall() {
//     try {
//       const { jobRole, count = 5 } = req.body;
      
//       if (!jobRole) {
//         return res.status(400).json({
//           error: 'Missing required field',
//           message: 'Job role is required'
//         });
//       }

      

//       // Validate API key first
//       if (!validateApiKey()) {
//         return res.status(401).json({
//           error: 'Configuration error',
//           message: 'API key is not configured'
//         });
//       }

//       // Set proper content type header
//       res.setHeader('Content-Type', 'application/json');
//       res.setHeader('Cache-Control', 'no-store');
//       res.type('application/json');
      
//       const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      
//       const prompt = `You are an expert technical interviewer for ${jobRole} positions. Generate ${count} challenging but fair interview questions that assess both technical skills and problem-solving ability. Format your response as a JSON object with this structure: {"questions": [{"question": "string", "type": "technical|behavioral", "suggestedAnswer": "string"}]}. Ensure all responses are properly escaped JSON strings.`;
      
//       const result = await model.generateContent(prompt);
//       const response = await result.response;
//       const content = response.text();
      
//       if (!content) {
//         throw new Error('No content received from Gemini');
//       }

//       try {
//         // Clean the response content by removing markdown code blocks if present
//         const cleanedContent = content.replace(/```json\s*|```/g, '').trim();
        
//         // Parse and validate the response
//         const questions = JSON.parse(cleanedContent);
        
//         // Validate response structure
//         if (!questions.questions || !Array.isArray(questions.questions)) {
//           throw new Error('Invalid response structure from Gemini');
//         }
        
//         // Transform the response to match client expectations
//         const transformedResponse = {
//           behavioral: [],
//           technical: []
//         };
        
//         // Sort questions into behavioral and technical categories
//         questions.questions.forEach((q: { type: string; question: string; suggestedAnswer: string }) => {
//           const category = q.type === 'behavioral' ? 'behavioral' : 'technical';
//           (transformedResponse[category] as Array<{
//             question: string;
//             suggestedAnswer: string;
//             category: string;
//           }>).push({
//             question: q.question,
//             suggestedAnswer: q.suggestedAnswer,
//             category: category
//           });
//         });
        
//         // Send the transformed JSON response
//         res.json(transformedResponse);
//       } catch (parseError) {
//         console.error('Error parsing Gemini response:', parseError);
//         throw new Error('Failed to parse Gemini response as JSON');
//       }
//     } catch (error: any) {
//       // Handle rate limit errors with retry logic
//       if (error?.status === 429) {
//         if (retryCount < MAX_RETRIES) {
//           const delay = exponentialDelay(retryCount);
//           console.log(`Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
//           retryCount++;
//           await new Promise(resolve => setTimeout(resolve, delay));
//           return attemptGeminiCall();
//         }
        
//         // If we've exhausted retries, return a specific error
//         return res.status(429).json({
//           error: 'Rate limit exceeded',
//           message: 'Too many requests. Please try again later.'
//         });
//       }
      
//       // Handle other API errors
//       const apiError = handleApiError(error);
//       return res.status(apiError.status).json(apiError);
//     }
//   }
  
//   // Start the initial attempt
//   attemptGeminiCall();
// });

// export default router;