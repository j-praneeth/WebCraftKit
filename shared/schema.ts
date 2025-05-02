import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user").notNull(), // user, organization_admin, creator_admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  profilePicture: text("profile_picture"),
  plan: text("plan").default("free").notNull(), // free, professional, enterprise
  mockInterviewsCount: integer("mock_interviews_count").default(0), // Track usage for free tier limits
  jobMatchScore: integer("job_match_score").default(0), // Track latest job match score
  lastJobMatch: timestamp("last_job_match"), // Track when the last job match was calculated
  provider: text("provider").default("local"), // local, google, linkedin, apple
  providerId: text("provider_id"), // ID from the OAuth provider
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().optional(), // Optional for OAuth users
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  role: z.string().optional().default("user"),
  profilePicture: z.string().optional().nullable(),
  plan: z.string().optional().default("free"),
  provider: z.string().optional().default("local"),
  providerId: z.string().optional(),
});

// Resume Templates table
export const resumeTemplates = pgTable("resume_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  structure: jsonb("structure").notNull(), // Layout and styling information
  category: text("category").notNull(), // 'free' or 'premium'
  previewImage: text("preview_image"), // URL to template preview image
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResumeTemplateSchema = createInsertSchema(resumeTemplates).pick({
  name: true,
  description: true,
  structure: true,
  category: true,
  previewImage: true,
});

// Resume table
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Changed to text to support MongoDB ObjectIds
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  templateId: text("template_id"), // Changed to text to support MongoDB ObjectIds
  atsScore: integer("ats_score"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isOptimized: boolean("is_optimized").default(false),
});

// Create a custom Zod schema for resumes that accepts mixed ID types for MongoDB

export const insertResumeSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  title: z.string(),
  content: z.any(),
  templateId: z.union([z.string(), z.number()]).optional(),
  atsScore: z.number().optional(),
  isOptimized: z.boolean().optional().default(false),
});

// Cover Letter table
export const coverLetters = pgTable("cover_letters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  jobTitle: text("job_title"),
  company: text("company"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertCoverLetterSchema = createInsertSchema(coverLetters).pick({
  userId: true,
  title: true,
  content: true,
  jobTitle: true,
  company: true,
});

// Interview Question table
export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Changed to text to support MongoDB ObjectIds
  question: text("question").notNull(),
  suggestedAnswer: text("suggested_answer"),
  category: text("category").default("behavioral"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Use custom schema for Interview Questions to support MongoDB IDs
export const insertInterviewQuestionSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  question: z.string(),
  suggestedAnswer: z.string().optional(),
  category: z.string().default("behavioral"),
});

// Mock Interview table
export const mockInterviews = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Changed to text to support MongoDB ObjectIds
  title: text("title").notNull(),
  score: integer("score"),
  feedback: jsonb("feedback"),
  transcript: text("transcript"),
  videoUrl: text("video_url"),
  date: timestamp("date").defaultNow().notNull(),
});

// Use custom schema for Mock Interviews to support MongoDB IDs
export const insertMockInterviewSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  title: z.string(),
  score: z.number().optional().nullable(),
  feedback: z.any().optional().nullable(),
  transcript: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
});

// Job Posting table
export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  salary: text("salary"),
  description: text("description"),
  requirements: jsonb("requirements"),
  postDate: timestamp("post_date").defaultNow().notNull(),
  source: text("source"),
  url: text("url"),
  matchScore: integer("match_score"),
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).pick({
  title: true,
  company: true,
  location: true,
  salary: true,
  description: true,
  requirements: true,
  source: true,
  url: true,
  matchScore: true,
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactEmail: text("contact_email").notNull(),
  subscription: text("subscription").default("basic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  contactEmail: true,
  subscription: true,
});

// Job Applications table
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Changed to text to support MongoDB ObjectIds
  jobPostingId: text("job_posting_id").notNull(), // Changed to text to support MongoDB ObjectIds
  resumeId: text("resume_id"),
  coverLetterId: text("cover_letter_id"),
  status: text("status").default("applied").notNull(), // applied, interviewing, rejected, offered, accepted
  appliedDate: timestamp("applied_date").defaultNow().notNull(),
  notes: text("notes"),
  followUpDate: timestamp("follow_up_date"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Use custom schema for Job Applications to support MongoDB IDs
export const insertJobApplicationSchema = z.object({
  userId: z.union([z.string(), z.number()]),
  jobPostingId: z.union([z.string(), z.number()]),
  resumeId: z.union([z.string(), z.number()]).optional().nullable(),
  coverLetterId: z.union([z.string(), z.number()]).optional().nullable(),
  status: z.string().default("applied"),
  notes: z.string().optional().nullable(),
  followUpDate: z.date().optional().nullable(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = {
  id: string | number;
  email: string;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
  plan: 'free' | 'premium';
  profilePicture: string | null;
  createdAt: Date;
  mockInterviewsCount: number;
  provider: string | null;
  providerId: string | null;
  jobMatchScore: number;
  lastJobMatch: Date | null;
  atsScore?: number;
  lastAtsUpdate?: Date | null;
};

export type InsertResumeTemplate = z.infer<typeof insertResumeTemplateSchema>;
export type ResumeTemplate = typeof resumeTemplates.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export interface InsertCoverLetter {
  userId: string;  // Changed from number to string to support MongoDB ObjectId
  title: string;
  content: string;
  jobTitle?: string | null;
  company?: string | null;
}

export interface CoverLetter {
  id: string;  // MongoDB ObjectId
  userId: string;  // MongoDB ObjectId
  title: string;
  content: string;
  jobTitle?: string | null;
  company?: string | null;
  lastUpdated: Date;
}

export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;

export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;
export type MockInterview = typeof mockInterviews.$inferSelect;

export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

// Add the missing JobApplication type definitions
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;