import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { connectDB } from "./db";
import { insertUserSchema, insertResumeSchema, insertCoverLetterSchema, insertInterviewQuestionSchema, insertResumeTemplateSchema, insertMockInterviewSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import OpenAI from "openai";
import { WebSocketServer, WebSocket } from 'ws';
import { sendInterviewFeedback, sendInterviewQuestions } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  try {
    await connectDB();
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error instanceof Error ? error.message : "An unknown error occurred");
    // Fall back to in-memory storage
    console.log("Falling back to in-memory storage");
  }
  
  // Serve static files for resume templates
  const staticMiddleware = express.static('public/templates');
  app.use('/templates', staticMiddleware);

  // Initialize OpenAI with API key from environment
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  
  // Setup session
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new SessionStore({ checkPeriod: 86400000 }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "ResuNextSecretKey",
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        // In a production app, we would use bcrypt to check the password
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // In a production app, we would hash the password here
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not logged in" });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Resume routes
  app.get("/api/resumes", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const resumes = await storage.getResumesByUserId(userId);
    res.json(resumes);
  });

  app.get("/api/resumes/:id", isAuthenticated, async (req, res) => {
    const resumeId = parseInt(req.params.id);
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    // Check if the resume belongs to the user
    if (resume.userId !== (req.user as any).id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(resume);
  });

  app.post("/api/resumes", isAuthenticated, async (req, res) => {
    try {
      // Get numeric user ID from the authenticated user
      const userId = Number((req.user as any).id);
      
      // Make sure templateId is a number if present
      let templateId = req.body.templateId ? Number(req.body.templateId) : null;
      
      console.log('Creating resume with data:', {
        ...req.body,
        userId,
        templateId
      });

      const resumeData = insertResumeSchema.parse({
        ...req.body,
        userId,
        templateId
      });
      
      console.log('Parsed resume data:', resumeData);
      
      const resume = await storage.createResume(resumeData);
      res.status(201).json(resume);
    } catch (error: any) {
      console.error('Failed to create resume:', error);
      
      if (error.errors) {
        // For Zod validation errors
        const validationErrors = error.errors.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        return res.status(400).json({ 
          message: `Validation error: ${validationErrors}`,
          errors: error.errors
        });
      }
      
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred",
        error: error instanceof Error ? error.toString() : undefined
      });
    }
  });

  app.put("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the resume belongs to the user
      if (resume.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedResume = await storage.updateResume(resumeId, req.body);
      res.json(updatedResume);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  app.delete("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the resume belongs to the user
      if (resume.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteResume(resumeId);
      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  // Cover letter routes
  app.get("/api/cover-letters", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const coverLetters = await storage.getCoverLettersByUserId(userId);
    res.json(coverLetters);
  });

  app.get("/api/cover-letters/:id", isAuthenticated, async (req, res) => {
    const letterId = parseInt(req.params.id);
    const letter = await storage.getCoverLetter(letterId);
    
    if (!letter) {
      return res.status(404).json({ message: "Cover letter not found" });
    }
    
    // Check if the cover letter belongs to the user
    if (letter.userId !== (req.user as any).id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(letter);
  });

  app.post("/api/cover-letters", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const letterData = insertCoverLetterSchema.parse({
        ...req.body,
        userId
      });
      
      const letter = await storage.createCoverLetter(letterData);
      res.status(201).json(letter);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  app.put("/api/cover-letters/:id", isAuthenticated, async (req, res) => {
    try {
      const letterId = parseInt(req.params.id);
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // Check if the letter belongs to the user
      if (letter.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedLetter = await storage.updateCoverLetter(letterId, req.body);
      res.json(updatedLetter);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  app.delete("/api/cover-letters/:id", isAuthenticated, async (req, res) => {
    try {
      const letterId = parseInt(req.params.id);
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // Check if the letter belongs to the user
      if (letter.userId !== (req.user as any).id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteCoverLetter(letterId);
      res.json({ message: "Cover letter deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  // Interview question routes
  app.get("/api/interview-questions", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const questions = await storage.getInterviewQuestionsByUserId(userId);
    res.json(questions);
  });

  app.post("/api/interview-questions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const questionData = insertInterviewQuestionSchema.parse({
        ...req.body,
        userId
      });
      
      const question = await storage.createInterviewQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  // Mock interview routes
  app.get("/api/mock-interviews", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const interviews = await storage.getMockInterviewsByUserId(userId);
    res.json(interviews);
  });
  
  app.post("/api/mock-interviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      // For free plan users, check if they've reached their limit (3 mock interviews)
      if (user?.plan === 'free') {
        const currentCount = user.mockInterviewsCount || 0;
        
        if (currentCount >= 3) {
          return res.status(403).json({ 
            message: "Free plan limited to 3 mock interviews. Please upgrade to continue.",
            currentCount,
            limit: 3,
            canUpgrade: true
          });
        }
      }
      
      // Create the mock interview
      const interviewData = {
        ...req.body,
        userId
      };
      
      const interview = await storage.createMockInterview(interviewData);
      
      // Update the user's interview count
      const newCount = await storage.updateMockInterviewCount(userId);
      
      res.status(201).json({
        interview,
        mockInterviewsCount: newCount,
        limit: user?.plan === 'free' ? 3 : null
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });
  
  // Resume Template routes
  app.get("/api/resume-templates", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = await storage.getResumeTemplates(category);
      
      // Filter templates based on user's plan
      // Free users should only see free templates, premium users see all
      const userPlan = req.isAuthenticated() ? (req.user as any).plan : 'free';
      
      const filteredTemplates = userPlan === 'premium' 
        ? templates 
        : templates.filter(template => template.category === 'free');
      
      res.json(filteredTemplates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });
  
  app.get("/api/resume-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const template = await storage.getResumeTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check if user has access to this template category
      if (template.category === 'premium' && (!req.isAuthenticated() || (req.user as any).plan !== 'premium')) {
        return res.status(403).json({ message: "Premium plan required for this template" });
      }
      
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });
  
  // Admin-only route to create new templates
  app.post("/api/resume-templates", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if ((req.user as any).role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const templateData = insertResumeTemplateSchema.parse(req.body);
      const template = await storage.createResumeTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  // Job posting routes
  app.get("/api/jobs", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const jobs = await storage.getJobPostings(limit);
    res.json(jobs);
  });

  // OpenAI integration routes

  // AI API routes
  app.post('/api/optimize-resume', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobDescription } = req.body;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert ATS (Applicant Tracking System) optimizer. Your task is to analyze a resume against a job description, optimize the content for ATS algorithms, provide an ATS match score, and suggest improvements. Return your analysis in JSON format."
          },
          {
            role: "user",
            content: `Resume: ${JSON.stringify(resumeContent)}\n\nJob Description: ${jobDescription}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const result = JSON.parse(content);
      
      res.json({
        optimizedContent: result.optimizedContent || resumeContent,
        atsScore: result.atsScore || 70,
        suggestions: result.suggestions || []
      });
    } catch (error) {
      console.error("Error optimizing resume:", error);
      res.status(500).json({ error: "Failed to optimize resume" });
    }
  });

  app.post('/api/generate-cover-letter', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobDescription, companyName } = req.body;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert cover letter writer. Create a professional, personalized cover letter based on the provided resume and job description."
          },
          {
            role: "user",
            content: `Resume: ${JSON.stringify(resumeContent)}\n\nJob Description: ${jobDescription}\n\nCompany: ${companyName}`
          }
        ]
      });

      res.json({
        coverLetter: response.choices[0]?.message?.content || "Could not generate cover letter."
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ error: "Failed to generate cover letter" });
    }
  });

  app.post('/api/predict-interview-questions', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobTitle, sendEmail = false } = req.body;
      const user = req.user as any;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: "You are an expert interview coach with deep knowledge of the latest industry trends and hiring practices. Generate a comprehensive set of likely interview questions based on the resume and job title. For each question, create a detailed suggested answer using the STAR format (Situation, Task, Action, Result) when appropriate. Include 5-7 behavioral questions and 5-7 technical questions specific to the job role. For technical questions, ensure they test the actual skills needed for the position. Return your response as JSON with the format {\"behavioral\": [{\"question\": string, \"suggestedAnswer\": string}], \"technical\": [{\"question\": string, \"suggestedAnswer\": string}]}."
          },
          {
            role: "user",
            content: `Resume: ${JSON.stringify(resumeContent)}\n\nJob Title: ${jobTitle}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{"behavioral":[],"technical":[]}';
      const result = JSON.parse(content);
      
      // Create separate records for each question in the database
      const behavioralQuestions = result.behavioral || [];
      const technicalQuestions = result.technical || [];
      
      // Store each question separately
      for (const q of behavioralQuestions) {
        await storage.createInterviewQuestion({
          userId: user.id,
          question: q.question,
          suggestedAnswer: q.suggestedAnswer || null,
          category: 'behavioral'
        });
      }
      
      for (const q of technicalQuestions) {
        await storage.createInterviewQuestion({
          userId: user.id,
          question: q.question,
          suggestedAnswer: q.suggestedAnswer || null,
          category: 'technical'
        });
      }
      
      // Send email if requested
      if (sendEmail && user.email) {
        const allQuestions = [
          ...(behavioralQuestions.map((q: { question: string }) => q.question)),
          ...(technicalQuestions.map((q: { question: string }) => q.question))
        ];
        
        try {
          await sendInterviewQuestions(
            user.email,
            user.firstName || user.username,
            jobTitle,
            allQuestions
          );
        } catch (emailError) {
          console.error("Failed to send interview questions email:", emailError);
          // Continue even if email fails
        }
      }
      
      res.json({
        behavioral: result.behavioral || [],
        technical: result.technical || [],
        emailSent: sendEmail
      });
    } catch (error) {
      console.error("Error predicting interview questions:", error);
      res.status(500).json({ error: "Failed to predict interview questions" });
    }
  });

  app.post('/api/analyze-mock-interview', isAuthenticated, async (req, res) => {
    try {
      const { videoTranscript, jobRole, sendEmail = false } = req.body;
      const user = req.user as any;
      
      // Improve the prompt to generate better analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // The newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: `You are an expert interview coach and hiring manager with extensive experience in evaluating candidates for ${jobRole || "various"} positions. 
            
Analyze this interview transcript and provide detailed, actionable feedback on the candidate's performance. 

Score the interview on a scale of 0-100 based on the following criteria:
- Communication clarity and effectiveness (20%)
- Relevant examples and experiences (20%)
- Technical knowledge and problem-solving ability (25%)
- Cultural fit and soft skills (15%)
- Overall interview strategy and preparation (20%)

In your analysis, please provide:
1. A numerical score (0-100)
2. At least 3-5 specific strengths with concrete examples from the transcript
3. At least 3-5 areas for improvement with actionable recommendations
4. An overall assessment summary of no more than 150 words
5. 2-3 specific follow-up practice questions the candidate should prepare for

Format your response as a JSON object with the following structure:
{
  "score": number,
  "feedback": {
    "strengths": string[],
    "improvements": string[],
    "overall": string
  },
  "followupQuestions": string[]
}`
          },
          {
            role: "user",
            content: `Interview Transcript for ${jobRole || "Job"} Position: ${videoTranscript}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{"score":70,"feedback":{"strengths":[],"improvements":[],"overall":"No feedback available"},"followupQuestions":[]}';
      const result = JSON.parse(content);
      
      // Save the interview feedback to database
      const interviewData = {
        userId: user.id,
        title: `${jobRole || "Interview"} - ${new Date().toLocaleDateString()}`,
        score: result.score || 70,
        transcript: videoTranscript.substring(0, 1000) + "...", // Store truncated transcript
        feedback: {
          strengths: result.feedback?.strengths || [],
          improvements: result.feedback?.improvements || [],
          overall: result.feedback?.overall || "No feedback available",
          followupQuestions: result.followupQuestions || [],
          jobRole: jobRole || "Not specified"
        }
      };
      
      const savedInterview = await storage.createMockInterview(interviewData);
      
      // Send email if requested
      if (sendEmail && user.email) {
        try {
          const feedbackPoints = [
            ...(result.feedback?.strengths || []).map((s: string) => `✓ ${s}`),
            ...(result.feedback?.improvements || []).map((i: string) => `→ ${i}`)
          ];
          
          await sendInterviewFeedback(
            user.email,
            user.firstName || user.username,
            result.score || 70,
            feedbackPoints
          );
        } catch (emailError) {
          console.error("Failed to send interview feedback email:", emailError);
          // Continue even if email fails
        }
      }
      
      res.json({
        interviewId: savedInterview.id,
        score: result.score || 70,
        feedback: {
          strengths: result.feedback?.strengths || [],
          improvements: result.feedback?.improvements || [],
          overall: result.feedback?.overall || "No feedback available"
        },
        followupQuestions: result.followupQuestions || [],
        emailSent: sendEmail
      });
    } catch (error) {
      console.error("Error analyzing mock interview:", error);
      res.status(500).json({ error: "Failed to analyze interview" });
    }
  });

  app.post('/api/calculate-job-match', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobDescription } = req.body;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert job matching algorithm. Calculate a match score between a resume and job description. Identify matching and missing keywords. Return your analysis in JSON format."
          },
          {
            role: "user",
            content: `Resume: ${JSON.stringify(resumeContent)}\n\nJob Description: ${jobDescription}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content || '{"score":70,"missingKeywords":[],"matchingKeywords":[]}';
      const result = JSON.parse(content);
      
      res.json({
        score: result.score || 70,
        missingKeywords: result.missingKeywords || [],
        matchingKeywords: result.matchingKeywords || []
      });
    } catch (error) {
      console.error("Error calculating job match score:", error);
      res.status(500).json({ error: "Failed to calculate job match score" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket Server for interactive interviews
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active interview sessions
  const activeSessions = new Map();
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    let sessionId = null;
    let jobRole = null;
    let userId = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'start') {
          // Initialize a new interview session
          sessionId = Date.now().toString();
          jobRole = data.jobRole || 'Software Developer';
          userId = data.userId;
          
          // Store session info
          activeSessions.set(sessionId, { 
            ws, 
            jobRole, 
            userId, 
            questionCount: 0,
            lastActivity: Date.now()
          });
          
          // After a brief pause, send the first question
          setTimeout(async () => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                const firstQuestion = await generateInterviewQuestion(jobRole);
                ws.send(JSON.stringify({
                  type: 'question',
                  content: firstQuestion
                }));
                
                // Update question count
                const session = activeSessions.get(sessionId);
                if (session) {
                  session.questionCount++;
                  session.lastQuestion = firstQuestion;
                  session.lastActivity = Date.now();
                }
              } catch (error) {
                console.error('Error generating first question:', error);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Failed to generate interview question. Please try again.'
                }));
              }
            }
          }, 3000);
        }
        else if (data.type === 'answer' && sessionId) {
          // User has answered a question
          const session = activeSessions.get(sessionId);
          
          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Session not found. Please restart the interview.'
            }));
            return;
          }
          
          // Update session activity
          session.lastActivity = Date.now();
          session.lastAnswer = data.content;
          
          // Based on their answer, either provide a follow-up comment or ask a new question
          try {
            // 30% chance of follow-up, 70% chance of new question
            const shouldAskFollowUp = Math.random() < 0.3;
            
            if (shouldAskFollowUp && session.lastQuestion && session.questionCount <= 10) {
              // Generate a follow-up comment or question
              const followUp = await generateFollowUpComment(jobRole, session.lastQuestion, data.content);
              
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'follow_up',
                  content: followUp
                }));
              }
            } else {
              // After a brief pause, send the next question
              setTimeout(async () => {
                if (ws.readyState === WebSocket.OPEN) {
                  try {
                    // Only ask more questions if we haven't reached the limit (typically 10-12 questions)
                    if (session.questionCount < 10) {
                      const nextQuestion = await generateInterviewQuestion(jobRole, session.questionCount);
                      ws.send(JSON.stringify({
                        type: 'question',
                        content: nextQuestion
                      }));
                      
                      // Update session
                      session.questionCount++;
                      session.lastQuestion = nextQuestion;
                    } else {
                      // If we've asked enough questions, send a closing message
                      ws.send(JSON.stringify({
                        type: 'question',
                        content: "That covers all the questions I had prepared. Do you have any questions for me about the position or the company?"
                      }));
                    }
                  } catch (error) {
                    console.error('Error generating next question:', error);
                    ws.send(JSON.stringify({
                      type: 'error',
                      message: 'Failed to generate next question. Please try again.'
                    }));
                  }
                }
              }, 2000);
            }
          } catch (error) {
            console.error('Error processing answer:', error);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process your answer. Please try again.'
              }));
            }
          }
        }
        else if (data.type === 'end' && sessionId) {
          // Interview ended by user
          activeSessions.delete(sessionId);
          console.log(`Interview session ${sessionId} ended by user`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Server error. Please try again.'
          }));
        }
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (sessionId) {
        activeSessions.delete(sessionId);
      }
    });
  });
  
  // Helper function to generate interview questions using OpenAI
  async function generateInterviewQuestion(jobRole: string, questionNumber: number = 0): Promise<string> {
    try {
      // Determine question type based on the question number
      let questionType = "general";
      
      if (questionNumber === 0) {
        questionType = "introduction";
      } else if (questionNumber === 1 || questionNumber === 2) {
        questionType = "experience";
      } else if (questionNumber === 3 || questionNumber === 4) {
        questionType = "technical";
      } else if (questionNumber === 5 || questionNumber === 6) {
        questionType = "behavioral";
      } else if (questionNumber === 7 || questionNumber === 8) {
        questionType = "situational";
      } else if (questionNumber >= 9) {
        questionType = "advanced";
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an experienced technical interviewer conducting a job interview for a ${jobRole} position. 
                    Generate a single, thoughtful interview question appropriate for this stage of the interview.
                    Current question number: ${questionNumber + 1}
                    Question type: ${questionType}
                    
                    Make your question conversational and natural, as if asked in a real interview.
                    Do not include any preamble or explanation - just ask the question directly as the interviewer would.
                    Do not number the question or include "Question:" before it.
                    Ask only ONE question in your response.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      return response.choices[0]?.message?.content || "Could you tell me about your relevant experience for this role?";
    } catch (error) {
      console.error("Error generating interview question:", error);
      return "Could you tell me about your background and experience relevant to this position?";
    }
  }
  
  // Helper function to generate follow-up comments to answers
  async function generateFollowUpComment(jobRole: string, question: string, answer: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an experienced technical interviewer conducting a job interview for a ${jobRole} position.
                    Based on the candidate's answer to your question, provide a brief, natural follow-up comment or question.
                    Be conversational and authentic, as a real interviewer would be.
                    You can acknowledge their answer, ask for clarification, or probe deeper.
                    Keep your response brief (1-2 sentences).`
          },
          {
            role: "user",
            content: `My question was: "${question}"\n\nCandidate's answer: "${answer}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      });
      
      return response.choices[0]?.message?.content || "That's interesting. Let's move on to the next question.";
    } catch (error) {
      console.error("Error generating follow-up comment:", error);
      return "I see, thank you for sharing that. Let's continue with our next question.";
    }
  }
  
  // Clean up inactive sessions periodically (every 30 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions.entries()) {
      // If the session has been inactive for more than 30 minutes, close it
      if (now - session.lastActivity > 30 * 60 * 1000) {
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(JSON.stringify({
            type: 'error',
            message: 'Session timed out due to inactivity.'
          }));
          session.ws.close();
        }
        activeSessions.delete(sessionId);
        console.log(`Cleaned up inactive interview session ${sessionId}`);
      }
    }
  }, 30 * 60 * 1000);
  
  return httpServer;
}
