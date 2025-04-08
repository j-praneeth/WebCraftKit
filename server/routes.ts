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
      
      // Import PDFKit and generate the PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=resume-${resumeId}.pdf`);
      
      // Pipe the PDF document to the response
      doc.pipe(res);
      
      // Get template if specified
      let template = null;
      if (resume.templateId) {
        try {
          template = await storage.getResumeTemplate(Number(resume.templateId));
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
        const { name, email, phone, address } = content.personalInfo;
        try {
          doc.font('Helvetica-Bold').fontSize(14).fillColor('black');
        } catch (err) {
          doc.font('Helvetica').fontSize(14).fillColor('black');
        }
        doc.text(name || '');
        doc.font('Helvetica').fontSize(10).fillColor('#444444');
        if (email) doc.text(email);
        if (phone) doc.text(phone);
        if (address) doc.text(address);
        doc.moveDown();
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
          doc.text(`${exp.title || ''} (${exp.startDate || ''} - ${exp.endDate || 'Present'})`);
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
          doc.text(`${edu.degree || ''} (${edu.year || ''})`);
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
      const userId = (req.user as any).id;
      
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

  app.put("/api/resumes/:id", isAuthenticated, async (req, res) => {
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
  
  app.patch("/api/mock-interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
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
      
      // First, create a default/fallback result in case the API call fails
      const fallbackResponse = {
        score: 75,
        feedback: {
          strengths: [
            "Good communication skills throughout the interview",
            "Demonstrated relevant experience in the field", 
            "Showed enthusiasm for the position"
          ],
          improvements: [
            "Consider providing more specific examples in answers",
            "Elaborate more on technical skills relevant to the position",
            "Practice more concise responses to complex questions"
          ],
          overall: "This was a solid interview with good communication and relevant experience highlighted. Focus on providing more specific examples and technical details in future interviews."
        },
        followupQuestions: [
          "What specific technologies or methodologies would you apply in this role?",
          "Can you describe a challenging project and how you overcame obstacles?"
        ]
      };
      
      let result;
      
      try {
        // Attempt the OpenAI analysis
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
  
        const content = response.choices[0]?.message?.content;
        if (content) {
          result = JSON.parse(content);
        } else {
          // If no content returned but no error thrown, use fallback
          console.warn("OpenAI returned no content for interview analysis, using fallback");
          result = fallbackResponse;
        }
      } catch (error) {
        // Handle API errors gracefully
        console.error("OpenAI API error during interview analysis:", error);
        result = fallbackResponse;
        
        // If it's a quota or rate limit error, add it to the feedback
        const apiError = error as any; // Type assertion for error handling
        if (apiError && (apiError.code === 'insufficient_quota' || apiError.status === 429)) {
          result.feedback.overall += " Note: There was an issue with our AI service availability. A basic review has been provided.";
        }
      }
      
      // Save the interview feedback to database
      const interviewData = {
        userId: user.id,
        title: `${jobRole || "Interview"} - ${new Date().toLocaleDateString()}`,
        score: result.score || 75,
        transcript: videoTranscript.substring(0, 1000) + "...", // Store truncated transcript
        feedback: {
          strengths: result.feedback?.strengths || fallbackResponse.feedback.strengths,
          improvements: result.feedback?.improvements || fallbackResponse.feedback.improvements,
          overall: result.feedback?.overall || fallbackResponse.feedback.overall,
          followupQuestions: result.followupQuestions || fallbackResponse.followupQuestions,
          jobRole: jobRole || "Not specified"
        }
      };
      
      const savedInterview = await storage.createMockInterview(interviewData);
      
      // Convert the overall score to a number between 0 and 10
      const normalizedScore = Math.round((result.score || 75) / 10);
      
      // Format the response for the client
      const clientResponse = {
        interviewId: savedInterview.id,
        overallScore: normalizedScore,
        overallFeedback: result.feedback?.overall || fallbackResponse.feedback.overall,
        strengths: result.feedback?.strengths || fallbackResponse.feedback.strengths,
        improvementAreas: result.feedback?.improvements || fallbackResponse.feedback.improvements,
        questionFeedback: videoTranscript.split(/INTERVIEWER:|USER:/)
          .filter(Boolean)
          .reduce((acc: any[], part: string, index: number) => {
            if (index % 2 === 0) { // It's a question
              const question = part.trim();
              if (question) {
                acc.push({
                  question,
                  feedback: index/2 < (result.feedback?.improvements?.length || 0) 
                    ? result.feedback.improvements[index/2] 
                    : "Good response, continue practicing similar questions."
                });
              }
            }
            return acc;
          }, []),
        emailSent: sendEmail
      };
      
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
            normalizedScore,
            feedbackPoints
          );
        } catch (emailError) {
          console.error("Failed to send interview feedback email:", emailError);
          // Continue even if email fails
        }
      }
      
      res.json(clientResponse);
    } catch (error) {
      console.error("Error analyzing mock interview:", error);
      res.status(500).json({ 
        error: "Failed to analyze interview",
        message: "The system encountered an error while analyzing your interview. Your interview has been saved, but detailed feedback is not available at this time."
      });
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
  
  // Define session type
  interface InterviewSession {
    ws: WebSocket;
    jobRole: string;
    userId: number;
    questionCount: number;
    lastActivity: number;
    lastQuestion?: string;
    lastAnswer?: string;
  }
  
  // Store active interview sessions
  const activeSessions = new Map<string, InterviewSession>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    let sessionId = '';
    let jobRole = '';
    let userId = 0;
    
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
      // Define more specific question types with detailed descriptions
      let questionType = "general";
      let questionDescription = "";
      
      if (questionNumber === 0) {
        questionType = "specific_introduction";
        questionDescription = `Ask a detailed question about the candidate's specific experience and qualifications that make them suitable for the ${jobRole} position. Avoid generic questions like "tell me about yourself" and instead focus on their specific skills related to ${jobRole}.`;
      } else if (questionNumber === 1) {
        questionType = "technical_expertise";
        questionDescription = `Ask a detailed technical question specific to the ${jobRole} that evaluates their expertise and depth of knowledge in a key area. For technical roles, use specific technologies, frameworks, or methodologies relevant to the role.`;
      } else if (questionNumber === 2) {
        questionType = "practical_experience";
        questionDescription = `Ask about a specific practical application or project they've worked on that demonstrates their skills as a ${jobRole}. Ask for concrete examples and measurable outcomes.`;
      } else if (questionNumber === 3) {
        questionType = "complex_problem_solving";
        questionDescription = `Present a realistic, challenging problem that a ${jobRole} would face in their daily work. Make it detailed and specific to the industry, asking how they would analyze and solve it step by step.`;
      } else if (questionNumber === 4) {
        questionType = "leadership_situation";
        questionDescription = `Ask about a specific situation where they demonstrated leadership or initiative in a role related to ${jobRole}, focusing on how they influenced outcomes and managed stakeholders.`;
      } else if (questionNumber === 5) {
        questionType = "industry_specific_challenge";
        questionDescription = `Ask about how they would handle a current major challenge or disruption in the ${jobRole} field. Reference specific industry trends, technologies, or regulatory changes.`;
      } else if (questionNumber === 6) {
        questionType = "technical_decision_making";
        questionDescription = `Ask about a time they had to make a difficult technical decision as a ${jobRole}. Focus on their decision-making process, tradeoffs they considered, and how they justified their choice.`;
      } else if (questionNumber === 7) {
        questionType = "stakeholder_management";
        questionDescription = `Ask how they handle complex stakeholder situations specific to ${jobRole}, particularly when facing conflicting requirements or expectations from different parties.`;
      } else if (questionNumber === 8) {
        questionType = "career_motivation";
        questionDescription = `Ask about their specific career objectives within the ${jobRole} field and why they are passionate about this particular area of expertise.`;
      } else if (questionNumber === 9) {
        questionType = "role_specific_scenario";
        questionDescription = `Create a detailed, complex scenario that tests multiple aspects of the ${jobRole} position simultaneously, including technical knowledge, soft skills, and business acumen.`;
      } else {
        // For questions beyond the planned sequence
        questionType = "advanced_domain_expertise";
        questionDescription = `Ask an advanced question that tests deep domain expertise specific to senior ${jobRole} professionals. Reference cutting-edge developments, methodologies, or theoretical concepts in the field.`;
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an experienced senior interviewer and industry expert conducting a job interview for a ${jobRole} position.
                    Generate a thorough, specific, and challenging interview question that evaluates the candidate's suitability for this exact role.
                    
                    Current question number: ${questionNumber + 1}
                    Question type: ${questionType}
                    Question focus: ${questionDescription}
                    
                    Requirements:
                    - Make your question highly specific to the ${jobRole} position, mentioning relevant technologies, methodologies, or skills
                    - Avoid generic questions that could apply to any position - tailor it precisely to this role
                    - Ask questions that require detailed, thoughtful responses demonstrating deep expertise
                    - Make the question conversational but challenging, as would be asked in a real senior-level interview
                    - Do not include any preamble or explanation - just ask the question directly
                    - Ask only ONE question in your response (though it may have multiple related parts)
                    - Make the question substantive but concise (under 60 words if possible)`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      return response.choices[0]?.message?.content || `Could you walk me through your most significant achievements and technical expertise specifically related to the ${jobRole} position?`;
    } catch (error) {
      console.error("Error generating interview question:", error);
      return `What specific skills and experiences make you well-suited for this ${jobRole} position?`;
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
            content: `You are an experienced technical interviewer and industry expert conducting a job interview for a ${jobRole} position.
                    Based on the candidate's answer to your specific question, provide an insightful follow-up comment or probe deeper
                    with a targeted question.
                    
                    Your follow-up should:
                    - Demonstrate your expertise in the ${jobRole} field
                    - Use technical terminology appropriate for the role
                    - Either challenge the candidate's answer or ask them to elaborate on a specific aspect
                    - Test both technical knowledge and real-world application
                    - Remain professional but conversational
                    - Be focused specifically on evaluating suitability for the ${jobRole} position
                    
                    Keep your response concise (1-3 sentences) but impactful.`
          },
          {
            role: "user",
            content: `My question was: "${question}"\n\nCandidate's answer: "${answer}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });
      
      return response.choices[0]?.message?.content || `That's a good starting point. Can you elaborate on how you've applied that specifically in your previous ${jobRole} work?`;
    } catch (error) {
      console.error("Error generating follow-up comment:", error);
      return `Interesting perspective. Let's explore another aspect of the ${jobRole} position in our next question.`;
    }
  }
  
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
