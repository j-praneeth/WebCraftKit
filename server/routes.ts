import express from "express";
import type { Express, Request, Response } from "express";
import { createServer } from "http";
import type { Server as HttpServer } from "http";
import { storage } from "./storage";
import { connectDB } from "./db";
import { insertUserSchema, insertResumeSchema, insertCoverLetterSchema, insertInterviewQuestionSchema, insertResumeTemplateSchema, insertMockInterviewSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { genAI, MODEL_CONFIG, handleApiError } from './config/ai-config';
import { WebSocketServer, WebSocket } from 'ws';
import { sendInterviewFeedback, sendInterviewQuestions } from "./email";
import { type User } from "@shared/schema";
// import interviewQuestionsRouter from './api/interview-questions';
import interviewQuestionsRouter from './api/gemini-questions';
import type { GenerateContentResult } from '@google/generative-ai';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import mongoose from 'mongoose';
import type { RequestInit } from 'node-fetch';

interface ExtendedRequestInit extends RequestInit {
  timeout?: number;
}

// Define WebSocket message types
type WebSocketMessage = {
  type: 'start' | 'answer' | 'end' | 'error' | 'question' | 'follow_up';
  content?: string;
  sessionId?: string;
  message?: string;
};

interface InterviewAnalysisResult {
  score: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    overall: string;
  };
  followupQuestions: string[];
}

// Helper function to clean and parse JSON response
function cleanAndParseJSON(response: string): any {
  try {
    // First, try to parse the response directly
    try {
      return JSON.parse(response);
    } catch (e) {
      // If direct parsing fails, try to clean the response
      let cleanResponse = response.trim();

      // Remove any markdown code block markers
      cleanResponse = cleanResponse.replace(/```(?:json)?\s*|\s*```$/g, '');

      // Remove any potential BOM or special characters
      cleanResponse = cleanResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

      // Ensure the response starts with a valid JSON object
      if (!cleanResponse.startsWith('{')) {
        cleanResponse = `{${cleanResponse}`;
      }

      // Ensure the response ends with a valid JSON object
      if (!cleanResponse.endsWith('}')) {
        cleanResponse = `${cleanResponse}}`;
      }

      // Remove any trailing commas
      cleanResponse = cleanResponse.replace(/,(\s*[}\]])/g, '$1');

      // Handle potential unescaped quotes
      cleanResponse = cleanResponse.replace(/([^\\])"/g, '$1\\"');

      // Try to find JSON content within the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      // Try parsing the cleaned response
      const parsed = JSON.parse(cleanResponse);

      // Validate required fields
      if (!parsed.question && !parsed.skills) {
        throw new Error('Missing required fields: question or skills');
      }

      return parsed;
    }
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Raw response:', response);
    
    // Try to recover by creating a basic question
    try {
      // Extract any text that might be a question
      const questionMatch = response.match(/[^.!?]+[.!?]+/);
      if (questionMatch) {
        return {
          question: questionMatch[0].trim(),
          skills: []
        };
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
    }
    
    // If all else fails, return a default question
    return {
      question: "Could you tell me about your experience in this field?",
      skills: []
    };
  }
}

export async function registerRoutes(app: Express): Promise<HttpServer> {
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

  // Initialize Gemini API
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key is not configured");
    process.exit(1);
  }
  
  // Register API routes
  app.use('/api', interviewQuestionsRouter);

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
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email) as User | null;
        if (!user) {
          return done(null, false, { message: "Incorrect email" });
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

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string | number, done) => {
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
      const existingUser = await storage.getUserByUsername(userData.email);
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
    const { password, ...userWithoutPassword } = req.user as User;
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
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Resume routes
  app.get("/api/resumes", isAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const resumes = await storage.getResumesByUserId(userId);
    res.json(resumes);
  });

  app.get("/api/resumes/:id", isAuthenticated, async (req, res) => {
    // Use the ID directly without parsing as integer, let the storage layer handle it
    const resumeId = req.params.id;
    console.log(`Attempting to get resume with ID: ${resumeId}`);
    
    const resume = await storage.getResume(resumeId);
    
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }
    
    // Check if the resume belongs to the user - compare as strings to ensure proper comparison
    const userIdStr = String((req.user as any).id);
    const resumeUserIdStr = String(resume.userId);
    
    if (resumeUserIdStr !== userIdStr) {
      console.log(`Access forbidden: Resume userId ${resumeUserIdStr} doesn't match logged in user ${userIdStr}`);
      return res.status(403).json({ message: "Forbidden" });
    }
    
    res.json(resume);
  });
  
  // Add PDF download endpoint
  app.get("/api/resumes/:id/pdf", isAuthenticated, async (req, res) => {
    try {
      const resumeId = req.params.id;
      console.log(`Attempting to generate PDF for resume with ID: ${resumeId}`);
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the resume belongs to the user - compare as strings for proper comparison
      const userIdStr = String((req.user as any).id);
      const resumeUserIdStr = String(resume.userId);
      
      if (resumeUserIdStr !== userIdStr) {
        console.log(`PDF generation forbidden: Resume userId ${resumeUserIdStr} doesn't match logged in user ${userIdStr}`);
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Import PDFKit dynamically since we're in ESM context
      const PDFKit = await import('pdfkit');
      const doc = new PDFKit.default({ margin: 50 });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=resume-${resumeId}.pdf`);
      
      // Pipe the PDF document to the response
      doc.pipe(res);
      
      // Get template if specified
      let template = null;
      if (resume.templateId) {
        try {
          template = await storage.getResumeTemplate(resume.templateId);
        } catch (err) {
          console.log(`Could not load template: ${err}`);
        }
      }
      
      // Ensure content is safe to access
      const content = resume.content as any || {};
      
      // Set some default styling based on the template or use defaults
      const structure = template?.structure as any || {};
      const primaryColor = structure.primaryColor || '#3b82f6';
      const fontFamily = (structure.fontFamily ? String(structure.fontFamily).split(',')[0] : null) || 'Helvetica';
      
      // Add the title
      try {
        doc.font(fontFamily).fontSize(24).fillColor(primaryColor);
      } catch (err) {
        // If font doesn't exist, fallback to default
        doc.font('Helvetica').fontSize(24).fillColor(primaryColor);
      }
      doc.text(resume.title, { align: 'center' });
      doc.moveDown();
      
      // Add personal info
      if (content.personalInfo) {
        const { name, email, phone, location, website, summary } = content.personalInfo;
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor('black');
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor('black');
        }
        doc.text(name || '');
        doc.font('Helvetica').fontSize(10).fillColor('#444444');
        if (email) doc.text(email);
        if (phone) doc.text(phone);
        if (location) doc.text(location);
        if (website) doc.text(website);
        doc.moveDown();

        // Add summary if exists
        if (summary) {
          doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor);
          doc.text('Professional Summary');
          doc.moveDown(0.5);
          doc.font('Helvetica').fontSize(10).fillColor('#444444');
          doc.text(summary);
          doc.moveDown();
        }
      }
      
      // Add experience section
      if (content.experience && Array.isArray(content.experience) && content.experience.length > 0) {
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor);
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor(primaryColor);
        }
        doc.text('Experience');
        doc.moveDown(0.5);
        
        content.experience.forEach((exp: any) => {
          try {
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
          } catch (err) {
            doc.font('Helvetica').fontSize(12).fillColor('black');
          }
          doc.text(exp.company || '');
          try {
            doc.font('Helvetica-Oblique').fontSize(10);
          } catch (err) {
            doc.font('Helvetica').fontSize(10);
          }
          doc.text(`${exp.position || ''}`);
          if (exp.location) {
            doc.text(exp.location);
          }
          doc.text(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`);
          doc.font('Helvetica').fontSize(10).fillColor('#444444');
          doc.text(exp.description || '');
          doc.moveDown();
        });
      }
      
      // Add education section
      if (content.education && Array.isArray(content.education) && content.education.length > 0) {
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor);
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor(primaryColor);
        }
        doc.text('Education');
        doc.moveDown(0.5);
        
        content.education.forEach((edu: any) => {
          try {
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
          } catch (err) {
            doc.font('Helvetica').fontSize(12).fillColor('black');
          }
          doc.text(edu.institution || '');
          doc.font('Helvetica').fontSize(10).fillColor('#444444');
          doc.text(`${edu.degree || ''}${edu.field ? ` in ${edu.field}` : ''}`);
          if (edu.location) {
            doc.text(edu.location);
          }
          doc.text(`${edu.startDate || ''} - ${edu.endDate || 'Present'}`);
          if (edu.description) {
            doc.text(edu.description);
          }
          doc.moveDown();
        });
      }
      
      // Add skills section
      if (content.skills && Array.isArray(content.skills) && content.skills.length > 0) {
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor);
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor(primaryColor);
        }
        doc.text('Skills');
        doc.moveDown(0.5);
        
        doc.font('Helvetica').fontSize(10).fillColor('#444444');
        doc.text(content.skills.join(', '));
        doc.moveDown();
      }
      
      // Add certifications section
      if (content.certifications && Array.isArray(content.certifications) && content.certifications.length > 0) {
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor);
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor(primaryColor);
        }
        doc.text('Certifications');
        doc.moveDown(0.5);
        
        content.certifications.forEach((cert: any) => {
          try {
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
          } catch (err) {
            doc.font('Helvetica').fontSize(12).fillColor('black');
          }
          doc.text(cert.name || '');
          doc.font('Helvetica').fontSize(10).fillColor('#444444');
          if (cert.issuer) doc.text(cert.issuer);
          if (cert.date) doc.text(cert.date);
          if (cert.description) doc.text(cert.description);
          doc.moveDown();
        });
      }

      // Add projects section
      if (content.projects && Array.isArray(content.projects) && content.projects.length > 0) {
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor);
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor(primaryColor);
        }
        doc.text('Projects');
        doc.moveDown(0.5);
        
        content.projects.forEach((project: any) => {
          try {
            doc.font('Helvetica-Bold').fontSize(12).fillColor('black');
          } catch (err) {
            doc.font('Helvetica').fontSize(12).fillColor('black');
          }
          doc.text(project.name || '');
          doc.font('Helvetica').fontSize(10).fillColor('#444444');
          if (project.description) doc.text(project.description);
          if (project.url) doc.text(project.url);
          if (project.technologies && Array.isArray(project.technologies)) {
            doc.text(`Technologies: ${project.technologies.join(', ')}`);
          }
          doc.moveDown();
        });
      }

      // Add ATS score if available
      if (resume.atsScore) {
        try {
          doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor);
        } catch (err) {
          doc.font('Helvetica').fontSize(10).fillColor(primaryColor);
        }
        doc.text(`ATS Optimization Score: ${resume.atsScore}%`, { align: 'right' });
      }
      
      // Finalize the PDF and end the stream
      doc.end();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  });

  app.post("/api/resumes", isAuthenticated, async (req, res) => {
    try {
      // MongoDB stores user IDs as strings, so we'll use the user ID directly
      const userId = (req.user as User).id;
      
      // Prepare resume data ensuring templateId is properly handled
      // Convert templateId to string or null to avoid NaN issues
      const templateId = req.body.templateId ? String(req.body.templateId) : null;
      
      console.log('Creating resume with:', {
        title: req.body.title,
        content: req.body.content || {},
        templateId,
        isOptimized: Boolean(req.body.isOptimized)
      });
      
      // Construct clean resume data object
      const resumeData = {
        title: req.body.title,
        content: req.body.content || {},
        templateId,
        isOptimized: Boolean(req.body.isOptimized),
        userId
      };
      
      // Validate with our schema
      const validatedData = insertResumeSchema.parse(resumeData);
      console.log('Validated resume data:', validatedData);
      
      const resume = await storage.createResume(validatedData);
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

  app.patch("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      // Use the ID directly without parsing as integer
      const resumeId = req.params.id;
      console.log(`Attempting to update resume with ID: ${resumeId}`);
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the resume belongs to the user - compare as strings
      const userIdStr = String((req.user as any).id);
      const resumeUserIdStr = String(resume.userId);
      
      if (resumeUserIdStr !== userIdStr) {
        console.log(`Update forbidden: Resume userId ${resumeUserIdStr} doesn't match logged in user ${userIdStr}`);
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedResume = await storage.updateResume(resumeId, req.body);
      res.json(updatedResume);
    } catch (error) {
      console.error('Error updating resume:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  app.delete("/api/resumes/:id", isAuthenticated, async (req, res) => {
    try {
      // Use the ID directly without parsing as integer
      const resumeId = req.params.id;
      console.log(`Attempting to delete resume with ID: ${resumeId}`);
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Check if the resume belongs to the user - compare as strings
      const userIdStr = String((req.user as any).id);
      const resumeUserIdStr = String(resume.userId);
      
      if (resumeUserIdStr !== userIdStr) {
        console.log(`Delete forbidden: Resume userId ${resumeUserIdStr} doesn't match logged in user ${userIdStr}`);
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteResume(resumeId);
      res.json({ message: "Resume deleted successfully" });
    } catch (error) {
      console.error('Error deleting resume:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  // Cover letter routes
  app.get("/api/cover-letters", isAuthenticated, async (req, res) => {
    const userId = (req.user as User).id;
    const coverLetters = await storage.getCoverLettersByUserId(userId);
    res.json(coverLetters);
  });

  app.get("/api/cover-letters/:id", isAuthenticated, async (req, res) => {
    const letterId = req.params.id;
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
      const userId = (req.user as User).id;
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
      const letterId = req.params.id;
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
      const letterId = req.params.id;
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
    const userId = (req.user as User).id;
    const questions = await storage.getInterviewQuestionsByUserId(userId);
    res.json(questions);
  });

  app.post("/api/interview-questions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
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
    const userId = (req.user as User).id;
    const interviews = await storage.getMockInterviewsByUserId(userId);
    res.json(interviews);
  });

  // Reset mock interview count endpoint
  app.get("/api/mock-interviews/reset-count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      
      // Get the actual count of mock interviews for this user
      const interviews = await storage.getMockInterviewsByUserId(userId);
      const actualCount = interviews.length;
      
      // Update the user's mock interview count to match the actual count
      await storage.updateUser(userId, { mockInterviewsCount: actualCount });
      
      res.json({
        success: true,
        count: actualCount,
        message: "Mock interview count has been reset to match actual interviews"
      });
    } catch (error) {
      console.error("Error resetting mock interview count:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset mock interview count"
      });
    }
  });

  app.post("/api/mock-interviews", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const user = await storage.getUser(userId);
  
      const mockInterviewsCount = user?.mockInterviewsCount ?? 0;
  
      // For free plan users, check if they've reached their limit
      if (user?.plan === 'free' && mockInterviewsCount >= 3) {
        return res.status(403).json({
          message: "Free plan limited to 3 mock interviews. Please upgrade to continue.",
          currentCount: mockInterviewsCount,
          limit: 3,
          canUpgrade: true
        });
      }
  
      // Create the mock interview
      const interviewData = {
        ...req.body,
        userId
      };
  
      const interview = await storage.createMockInterview(interviewData);
  
      // Update the user's interview count in DB
      await storage.updateUser(userId, { mockInterviewsCount: mockInterviewsCount + 1 });
  
      res.status(201).json({
        interview,
        mockInterviewsCount: mockInterviewsCount + 1,
        limit: user?.plan === 'free' ? 3 : null
      });
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  });
  
  
  // app.post("/api/mock-interviews", isAuthenticated, async (req, res) => {
  //   try {
  //     const userId = (req.user as User).id;
  //     const user = await storage.getUser(userId);
      
  //     // Get current interview count from actual interviews
  //     const currentInterviews = await storage.getMockInterviewsByUserId(userId);
  //     const actualCount = currentInterviews.length;
      
  //     // For free plan users, check if they've reached their limit (3 mock interviews)
  //     if (user?.plan === 'free') {
  //       if (actualCount >= 3) {
  //         return res.status(403).json({
  //           message: "Free plan limited to 3 mock interviews. Please upgrade to continue.",
  //           currentCount: actualCount,
  //           limit: 3,
  //           canUpgrade: true
  //         });
  //       }
  //     }
      
  //     // Create the mock interview
  //     const interviewData = {
  //       ...req.body,
  //       userId
  //     };
      
  //     const interview = await storage.createMockInterview(interviewData);
      
  //     // Update the user's interview count to match actual count
  //     await storage.updateUser(userId, { mockInterviewsCount: actualCount + 1 });
      
  //     res.status(201).json({
  //       interview,
  //       mockInterviewsCount: actualCount + 1,
  //       limit: user?.plan === 'free' ? 3 : null
  //     });
  //   } catch (error) {
  //     res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
  //   }
  // });
  
  app.patch("/api/mock-interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      // Use the ID directly as MongoDB ObjectId
      const interviewId = req.params.id;
      
      // Verify the interview exists and belongs to the user
      const interview = await storage.getMockInterview(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      // Convert userId to string when comparing with MongoDB ObjectId
      if (interview.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You don't have permission to update this interview" });
      }
      
      // Update the interview with the provided data
      const updatedInterview = await storage.updateMockInterview(interviewId, req.body);
      
      res.json(updatedInterview);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  });

  // Delete mock interview endpoint
  app.delete("/api/mock-interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as User).id;
      const interviewId = req.params.id;
      
      // Verify the interview exists and belongs to the user
      const interview = await storage.getMockInterview(interviewId);
      
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      if (interview.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You don't have permission to delete this interview" });
      }
      
      // Delete the interview
      await storage.deleteMockInterview(interviewId);
      
      // Update the user's interview count
      const remainingInterviews = await storage.getMockInterviewsByUserId(userId);
      await storage.updateUser(userId, { mockInterviewsCount: remainingInterviews.length });
      
      res.json({
        success: true,
        message: "Interview deleted successfully",
        remainingInterviews: remainingInterviews.length
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
      const templateId = req.params.id;
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

  // Gemini AI integration routes

  // AI API routes
  app.post('/api/optimize-resume', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobDescription } = req.body;
      
      const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      const prompt = `You are an expert ATS (Applicant Tracking System) optimizer. Your task is to analyze a resume against a job description, optimize the content for ATS algorithms, provide an ATS match score, and suggest improvements. Return your analysis in JSON format.\n\nResume: ${JSON.stringify(resumeContent)}\n\nJob Description: ${jobDescription}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      const parsedResult = JSON.parse(content || '{}');
      
      res.json({
        optimizedContent: parsedResult.optimizedContent || resumeContent,
        atsScore: parsedResult.atsScore || 70,
        suggestions: parsedResult.suggestions || []
      });
    } catch (error) {
      console.error("Error optimizing resume:", error);
      res.status(500).json({ error: "Failed to optimize resume" });
    }
  });

  app.post('/api/generate-cover-letter', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobDescription, companyName } = req.body;
      
      const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      const prompt = `You are an expert cover letter writer. Create a professional, personalized cover letter based on the provided resume and job description.\n\nResume: ${JSON.stringify(resumeContent)}\n\nJob Description: ${jobDescription}\n\nCompany: ${companyName}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text();
      
      res.json({
        coverLetter: content || "Could not generate cover letter."
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
      
      const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      const prompt = `You are an expert interview coach with deep knowledge of the latest industry trends and hiring practices. Generate a comprehensive set of likely interview questions based on the resume and job title. For each question, create a detailed suggested answer using the STAR format (Situation, Task, Action, Result) when appropriate. Include 5-7 behavioral questions and 5-7 technical questions specific to the job role. For technical questions, ensure they test the actual skills needed for the position. Return your response as JSON with the format {"behavioral": [{"question": string, "suggestedAnswer": string}], "technical": [{"question": string, "suggestedAnswer": string}]}.\n\nResume: ${JSON.stringify(resumeContent)}\n\nJob Title: ${jobTitle}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const content = response.text() || '{"behavioral":[],"technical":[]}';
      const parsedResult = JSON.parse(content);
      
      // Create separate records for each question in the database
      const behavioralQuestions = parsedResult.behavioral || [];
      const technicalQuestions = parsedResult.technical || [];
      
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
        behavioral: parsedResult.behavioral || [],
        technical: parsedResult.technical || [],
        emailSent: sendEmail
      });
    } catch (error) {
      console.error("Error predicting interview questions:", error);
      res.status(500).json({ error: "Failed to predict interview questions" });
    }
  });

  app.post('/api/analyze-mock-interview', async (req, res) => {
    try {
      const { jobRole, question, answer } = req.body;
      
      if (!jobRole || !question || !answer) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

        const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      
      // Generate detailed feedback
      const feedbackPrompt = `As an experienced technical interviewer for ${jobRole} position:
                  Analyze the following interview exchange and provide detailed feedback.
                  
                  Question: "${question}"
                  Answer: "${answer}"
                  
                  Requirements:
                  - Evaluate the technical accuracy of the answer
                  - Assess the clarity and structure of the response
                  - Identify any gaps or areas that need clarification
                  - Suggest improvements for future responses
                  - Keep the feedback constructive and actionable
                  
                  Format the feedback in a clear, structured manner.`;

      const feedbackResult = await model.generateContent(feedbackPrompt);
      const feedbackResponse = await feedbackResult.response;
      const feedback = feedbackResponse.text() || 'No specific feedback available.';

      // Generate follow-up question
      const followUpQuestion = await generateFollowUpComment(jobRole, answer);

      // Generate overall assessment
      const assessmentPrompt = `As an experienced technical interviewer for ${jobRole} position:
                  Provide a brief overall assessment of the candidate's response.
                  
                  Question: "${question}"
                  Answer: "${answer}"
                  
                  Requirements:
                  - Rate the response on a scale of 1-10
                  - Highlight key strengths
                  - Identify areas for improvement
                  - Keep the assessment concise and objective`;

      const assessmentResult = await model.generateContent(assessmentPrompt);
      const assessmentResponse = await assessmentResult.response;
      const assessment = assessmentResponse.text() || 'No assessment available.';

      res.json({
        feedback,
        followUpQuestion,
        assessment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error analyzing mock interview:', error);
      res.status(500).json({ 
        error: 'Failed to analyze interview response',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/calculate-job-match', isAuthenticated, async (req, res) => {
    try {
      const { resumeContent, jobDescription } = req.body;
      
      const response = await genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT }).generateContent({
        // model: "gpt-4o-mini",
        contents: [
          {
            role: "user",
            parts: [{
              text: `You are an expert job matching algorithm. Calculate a match score between a resume and job description. Identify matching and missing keywords. Return your analysis in JSON format.\n\nResume: ${JSON.stringify(resumeContent)}\n\nJob Description: ${jobDescription}`
            }]
          }
        ]
      });

      const defaultScore = Math.floor(Math.random() * (85 - 65 + 1)) + 65; // Generate random score between 65-85
      const content = response.response.text() || `{"score":${defaultScore},"missingKeywords":[],"matchingKeywords":[]}`;
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
  
  // Define session type
  interface InterviewSession {
    ws: WebSocket;
    jobRole: string;
    userId: string;
    questionCount: number;
    lastActivity: number;
    lastQuestion?: string;
    lastAnswer?: string;
  }
  
  // Store active interview sessions
  const activeSessions = new Map<string, InterviewSession>();
  
  // Add helper functions for interview analysis
  function extractTopics(text: string): string[] {
    // Simple implementation - split by common separators and filter out short words
    return text.toLowerCase()
      .split(/[\s,.!?]+/)
      .filter(word => word.length > 3)
      .filter((word, index, self) => self.indexOf(word) === index);
  }

  function analyzeResponse(text: string): { strengths: string[], areasToProbe: string[] } {
    // Simple implementation - return empty arrays for now
    return {
      strengths: [],
      areasToProbe: []
    };
  }

  // Add question type checkers
  function isTypeTechnical(question: string): boolean {
    return question.toLowerCase().includes('technical') || 
           question.toLowerCase().includes('technology') ||
           question.toLowerCase().includes('code') ||
           question.toLowerCase().includes('programming');
  }

  function isTypeBehavioral(question: string): boolean {
    return question.toLowerCase().includes('behavior') ||
           question.toLowerCase().includes('situation') ||
           question.toLowerCase().includes('experience') ||
           question.toLowerCase().includes('team');
  }

  function isTypeExperience(question: string): boolean {
    return question.toLowerCase().includes('experience') ||
           question.toLowerCase().includes('worked') ||
           question.toLowerCase().includes('job') ||
           question.toLowerCase().includes('role');
  }

  function isTypeProject(question: string): boolean {
    return question.toLowerCase().includes('project') ||
           question.toLowerCase().includes('work') ||
           question.toLowerCase().includes('task');
  }

  function isTypeChallenge(question: string): boolean {
    return question.toLowerCase().includes('challenge') ||
           question.toLowerCase().includes('difficult') ||
           question.toLowerCase().includes('problem') ||
           question.toLowerCase().includes('overcome');
  }

  function determineNextQuestionType(coverage: Record<string, number>, areasToProbe: string[]): string {
    // Simple implementation - return the type with least coverage
    const types = ['technical', 'behavioral', 'experience', 'project', 'challenge'];
    return types.reduce((minType, currentType) => 
      coverage[currentType] < coverage[minType] ? currentType : minType
    );
  }

  // Update the interview context interface
  interface InterviewContext {
    questionHistory: string[];
    answerHistory: string[];
    topicsDiscussed: Set<string>;
    candidateStrengths: string[];
    areasToProbe: string[];
    currentTopic: string;
    currentQuestion: string;
    updateContext: (question: string, answer: string) => void;
    getNextQuestionType: () => string;
  }

  // Update the interview context implementation
  const interviewContext: InterviewContext = {
    questionHistory: [],
    answerHistory: [],
    topicsDiscussed: new Set<string>(),
    candidateStrengths: [],
    areasToProbe: [],
    currentTopic: '',
    currentQuestion: '',
    
    updateContext(question: string, answer: string) {
      this.questionHistory.push(question);
      this.answerHistory.push(answer);
      
      // Analyze answer for keywords and topics
      const topics = extractTopics(answer);
      topics.forEach(topic => this.topicsDiscussed.add(topic));
      
      // Update candidate assessment
      const { strengths, areasToProbe } = analyzeResponse(answer);
      this.candidateStrengths.push(...strengths);
      this.areasToProbe.push(...areasToProbe);
    },
    
    getNextQuestionType() {
      // Determine next question type based on context
      const coverage = {
        technical: this.questionHistory.filter(q => isTypeTechnical(q)).length,
        behavioral: this.questionHistory.filter(q => isTypeBehavioral(q)).length,
        experience: this.questionHistory.filter(q => isTypeExperience(q)).length,
        project: this.questionHistory.filter(q => isTypeProject(q)).length,
        challenge: this.questionHistory.filter(q => isTypeChallenge(q)).length
      };
      
      // Balance question types and ensure comprehensive coverage
      return determineNextQuestionType(coverage, this.areasToProbe);
    }
  };

  // Add the missing generateInterviewResponse function
  async function generateInterviewResponse(
    jobRole: string,
    currentQuestion: string,
    answer: string,
    context: InterviewContext
  ): Promise<{ type: string; content: string }> {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      const prompt = `You are Ruby, an AI interviewer conducting a ${jobRole} interview. You should:
      1. Be conversational and natural, like a real interviewer
      2. Show active listening by referencing specific points from the candidate's answers
      3. Ask follow-up questions when the answer needs more detail
      4. Give encouraging but honest feedback
      5. Keep responses concise and clear
      6. Maintain a professional but friendly tone
      7. Never ask multiple questions at once
      8. Base each new question on the context of previous answers
      9. Use natural transitions between topics
      10. Show personality while staying professional

      Current question: "${currentQuestion}"
      Candidate's answer: "${answer}"
      Previous context: ${JSON.stringify(context)}

      Based on the candidate's answer, you should:
      - If the answer is detailed and complete, acknowledge it and move to a new topic
      - If the answer is incomplete or unclear, ask a specific follow-up question
      - If the answer shows a strength, acknowledge it and ask about a related experience
      - If the answer reveals a gap, ask about how they would handle that situation

      Respond in JSON format with EXACTLY these fields:
      {
        "type": "feedback" | "follow_up" | "question",
        "content": "Your response here"
      }`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      
      // Clean and parse the response
      let parsedResult;
      try {
        parsedResult = JSON.parse(text);
      } catch (e) {
        // If direct parsing fails, try to clean the response
        const cleanText = text
          .replace(/```(?:json)?\s*|\s*```$/g, '') // Remove markdown code blocks
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .trim();
        
        try {
          parsedResult = JSON.parse(cleanText);
        } catch (e) {
          // If still fails, create a context-aware response
          const isDetailed = answer.length > 100; // Simple heuristic for detailed answers
          parsedResult = {
            type: isDetailed ? 'question' : 'follow_up',
            content: isDetailed 
              ? 'That was very insightful. Could you tell me about another project where you demonstrated similar skills?'
              : 'Could you elaborate on that point? Specifically, what was your role in that situation?'
          };
        }
      }

      // Validate the response format
      if (!parsedResult || typeof parsedResult !== 'object') {
        throw new Error('Invalid response format');
      }

      // Ensure required fields exist
      if (!parsedResult.type || !parsedResult.content) {
        const isDetailed = answer.length > 100;
        parsedResult = {
          type: isDetailed ? 'question' : 'follow_up',
          content: isDetailed 
            ? 'That was very insightful. Could you tell me about another project where you demonstrated similar skills?'
            : 'Could you elaborate on that point? Specifically, what was your role in that situation?'
        };
      }

      // Validate type is one of the allowed values
      if (!['feedback', 'follow_up', 'question'].includes(parsedResult.type)) {
        parsedResult.type = 'follow_up';
      }

      return {
        type: parsedResult.type,
        content: parsedResult.content
      };
    } catch (error) {
      console.error('Error generating interview response:', error);
      const isDetailed = answer.length > 100;
      return {
        type: isDetailed ? 'question' : 'follow_up',
        content: isDetailed 
          ? 'That was very insightful. Could you tell me about another project where you demonstrated similar skills?'
          : 'Could you elaborate on that point? Specifically, what was your role in that situation?'
      };
    }
  }

  // Add the missing generateInterviewQuestion function
  async function generateInterviewQuestion(jobRole: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      const prompt = `Generate a professional interview question for a ${jobRole} position. The question should be:
      1. Specific to the role
      2. Open-ended to encourage detailed responses
      3. Focused on technical skills or experience
      4. Clear and concise
      5. Professional in tone

      Return ONLY the question text.`;

      const response = await model.generateContent(prompt);
      const question = response.response.text().trim();
      
      if (!question) {
        throw new Error('Failed to generate question');
      }

      return question;
    } catch (error) {
      console.error('Error generating interview question:', error);
      return `Could you tell me about your experience with ${jobRole} responsibilities?`;
    }
  }

  // Add the missing generateFollowUpComment function
  async function generateFollowUpComment(jobRole: string, answer: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_CONFIG.DEFAULT });
      const prompt = `Generate a brief follow-up comment for a ${jobRole} interview based on this answer:
      "${answer}"
      
      The comment should:
      1. Be encouraging and professional
      2. Reference specific points from the answer
      3. Be concise (1-2 sentences)
      4. Show active listening
      5. Maintain a friendly tone
      
      Return ONLY the comment text.`;

      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      
      if (!responseText) {
        throw new Error('Failed to generate follow-up comment');
      }

      return responseText;
    } catch (error) {
      console.error('Error generating follow-up comment:', error);
      return 'Thank you for sharing that. Could you tell me more about your experience?';
    }
  }

  // Handle WebSocket messages
  wss.on('connection', (ws: WebSocket) => {
    let sessionId: string | null = null;
    let jobRole: string = 'Software Developer';
    let userId: string | null = null;
    const context = { ...interviewContext }; // Create new context for each interview
    
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'start') {
          // Initialize a new interview session
          sessionId = Date.now().toString();
          jobRole = data.jobRole || 'Software Developer';
          userId = String(data.userId);
          
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
                const session = activeSessions.get(sessionId!);
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
          // Update interview context
          context.updateContext(context.currentQuestion, data.content);
          
          // Generate appropriate response
          const response = await generateInterviewResponse(
            data.jobRole,
            context.currentQuestion,
            data.content,
            context
          );
          
          // Send response to client
          ws.send(JSON.stringify(response));
          
          // Update current question if new question is generated
          if (response.type === 'question') {
            context.currentQuestion = response.content;
          }
        }
        else if (data.type === 'end' && sessionId) {
          // Interview ended by user
          activeSessions.delete(sessionId);
          console.log(`Interview session ${sessionId} ended by user`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
          message: 'Error processing your response'
          }));
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      if (sessionId) {
        activeSessions.delete(sessionId);
      }
    });
  });
  
  // Clean up inactive sessions periodically (every 30 minutes)
  setInterval(() => {
    const now = Date.now();
    // Convert entries to array for better compatibility
    Array.from(activeSessions.entries()).forEach(([sessionId, session]) => {
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
    });
  }, 30 * 60 * 1000);

  return httpServer;
}
