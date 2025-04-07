import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user").notNull(), // user, organization_admin, creator_admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  profilePicture: text("profile_picture"),
  plan: text("plan").default("free").notNull(), // free, premium, business
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  profilePicture: true,
  plan: true,
});

// Resume table
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  atsScore: integer("ats_score"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  isOptimized: boolean("is_optimized").default(false),
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  title: true,
  content: true,
  atsScore: true,
  isOptimized: true,
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
  userId: integer("user_id").notNull(),
  question: text("question").notNull(),
  suggestedAnswer: text("suggested_answer"),
  category: text("category").default("behavioral"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).pick({
  userId: true,
  question: true,
  suggestedAnswer: true,
  category: true,
});

// Mock Interview table
export const mockInterviews = pgTable("mock_interviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  score: integer("score"),
  feedback: jsonb("feedback"),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertMockInterviewSchema = createInsertSchema(mockInterviews).pick({
  userId: true,
  title: true,
  score: true,
  feedback: true,
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

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
export type CoverLetter = typeof coverLetters.$inferSelect;

export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;

export type InsertMockInterview = z.infer<typeof insertMockInterviewSchema>;
export type MockInterview = typeof mockInterviews.$inferSelect;

export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
