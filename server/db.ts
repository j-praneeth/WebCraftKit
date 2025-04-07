import mongoose from 'mongoose';
import { log } from './vite';

const MONGODB_URI = "mongodb+srv://praneethjanjanam:UiOyhKRP1fHOXUSd@ams.tvfb5.mongodb.net/";

// Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: 'user' },
  plan: { type: String, default: 'free' },
  profilePicture: { type: String },
  mockInterviewsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: Object, required: true },
  atsScore: { type: Number },
  lastUpdated: { type: Date, default: Date.now },
  isOptimized: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const coverLetterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  jobTitle: { type: String },
  company: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const interviewQuestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  answer: { type: String },
  category: { type: String },
  difficulty: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const mockInterviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  transcript: { type: String },
  feedback: { type: Object },
  score: { type: Number },
  videoUrl: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const jobPostingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String },
  salary: { type: String },
  type: { type: String },
  requirements: [{ type: String }],
  posted: { type: Date, default: Date.now },
  url: { type: String }
});

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  website: { type: String },
  industry: { type: String },
  logo: { type: String }
});

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  features: [{ type: String }],
  description: { type: String },
  recommended: { type: Boolean, default: false }
});

const resumeTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  structure: { type: Object, required: true },
  category: { type: String, enum: ['free', 'premium'], default: 'free' },
  previewImage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Register models
export const User = mongoose.model('User', userSchema);
export const Resume = mongoose.model('Resume', resumeSchema);
export const CoverLetter = mongoose.model('CoverLetter', coverLetterSchema);
export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
export const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
export const JobPosting = mongoose.model('JobPosting', jobPostingSchema);
export const Organization = mongoose.model('Organization', organizationSchema);
export const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);
export const ResumeTemplate = mongoose.model('ResumeTemplate', resumeTemplateSchema);

// Initialize pricing plans
async function initializePricingPlans() {
  try {
    const count = await PricingPlan.countDocuments();
    
    if (count === 0) {
      await PricingPlan.insertMany([
        {
          name: 'Free',
          price: 0,
          interval: 'monthly',
          features: [
            '1 Resume',
            '1 Cover Letter',
            'Basic Job Matching',
            'Limited Interview Questions',
            'Up to 3 Mock Interviews'
          ],
          description: 'Get started with essential tools for your job search',
          recommended: false
        },
        {
          name: 'Professional',
          price: 9.99,
          interval: 'monthly',
          features: [
            'Unlimited Resumes',
            'Unlimited Cover Letters',
            'Advanced Job Matching',
            'Unlimited Interview Questions',
            'Resume Analytics',
            'AI Optimization',
            'Premium Resume Templates'
          ],
          description: 'Everything you need for a successful job search',
          recommended: true
        },
        {
          name: 'Enterprise',
          price: 19.99,
          interval: 'monthly',
          features: [
            'All Professional Features',
            'Unlimited Mock Interviews with AI Feedback',
            'Priority Support',
            'Custom Resume Templates',
            'Team Management',
            'Advanced Analytics'
          ],
          description: 'Complete solution for serious job seekers',
          recommended: false
        }
      ]);
      
      log('Pricing plans initialized', 'db');
    }
  } catch (error) {
    console.error('Error initializing pricing plans:', error);
  }
}

// Initialize resume templates
async function initializeResumeTemplates() {
  try {
    const count = await ResumeTemplate.countDocuments();
    
    if (count === 0) {
      await ResumeTemplate.insertMany([
        {
          name: 'Professional',
          description: 'A clean and professional template suitable for most industries',
          structure: {
            sections: [
              { id: 'personal', title: 'Personal Information', required: true },
              { id: 'summary', title: 'Professional Summary', required: true },
              { id: 'experience', title: 'Work Experience', required: true },
              { id: 'education', title: 'Education', required: true },
              { id: 'skills', title: 'Skills', required: true },
              { id: 'certifications', title: 'Certifications', required: false },
              { id: 'languages', title: 'Languages', required: false }
            ],
            layout: 'standard'
          },
          category: 'free',
          previewImage: '/templates/professional.png'
        },
        {
          name: 'Modern',
          description: 'A contemporary design with a clean layout and subtle styling',
          structure: {
            sections: [
              { id: 'personal', title: 'Personal Information', required: true },
              { id: 'summary', title: 'Profile', required: true },
              { id: 'experience', title: 'Work Experience', required: true },
              { id: 'education', title: 'Education', required: true },
              { id: 'skills', title: 'Skills & Expertise', required: true },
              { id: 'projects', title: 'Projects', required: false },
              { id: 'certifications', title: 'Certifications', required: false },
              { id: 'interests', title: 'Interests', required: false }
            ],
            layout: 'modern'
          },
          category: 'free',
          previewImage: '/templates/modern.png'
        },
        {
          name: 'Executive',
          description: 'An elegant template designed for senior professionals and executives',
          structure: {
            sections: [
              { id: 'personal', title: 'Personal Information', required: true },
              { id: 'summary', title: 'Executive Summary', required: true },
              { id: 'experience', title: 'Professional Experience', required: true },
              { id: 'achievements', title: 'Key Achievements', required: true },
              { id: 'education', title: 'Education', required: true },
              { id: 'skills', title: 'Core Competencies', required: true },
              { id: 'leadership', title: 'Leadership', required: false },
              { id: 'certifications', title: 'Certifications', required: false },
              { id: 'publications', title: 'Publications', required: false }
            ],
            layout: 'executive'
          },
          category: 'premium',
          previewImage: '/templates/executive.png'
        },
        {
          name: 'Creative',
          description: 'A visually striking template for creative professionals',
          structure: {
            sections: [
              { id: 'personal', title: 'Personal Information', required: true },
              { id: 'summary', title: 'About Me', required: true },
              { id: 'experience', title: 'Experience', required: true },
              { id: 'education', title: 'Education', required: true },
              { id: 'skills', title: 'Skills', required: true },
              { id: 'portfolio', title: 'Portfolio', required: false },
              { id: 'awards', title: 'Awards', required: false },
              { id: 'interests', title: 'Interests', required: false }
            ],
            layout: 'creative'
          },
          category: 'premium',
          previewImage: '/templates/creative.png'
        },
        {
          name: 'Technical',
          description: 'Specifically designed for IT professionals, developers, and engineers',
          structure: {
            sections: [
              { id: 'personal', title: 'Personal Information', required: true },
              { id: 'summary', title: 'Technical Profile', required: true },
              { id: 'experience', title: 'Professional Experience', required: true },
              { id: 'education', title: 'Education', required: true },
              { id: 'skills', title: 'Technical Skills', required: true },
              { id: 'projects', title: 'Projects', required: true },
              { id: 'certifications', title: 'Certifications', required: false },
              { id: 'publications', title: 'Publications', required: false }
            ],
            layout: 'technical'
          },
          category: 'premium',
          previewImage: '/templates/technical.png'
        }
      ]);
      
      log('Resume templates initialized', 'db');
    }
  } catch (error) {
    console.error('Error initializing resume templates:', error);
  }
}

// Connect to MongoDB
export async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(MONGODB_URI);
    
    log('Connected to MongoDB', 'db');
    
    // Initialize pricing plans and resume templates
    await initializePricingPlans();
    await initializeResumeTemplates();
    
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    log('Disconnected from MongoDB', 'db');
    return true;
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
    return false;
  }
}

export default {
  connectDB,
  disconnectDB,
  User,
  Resume,
  CoverLetter,
  InterviewQuestion,
  MockInterview,
  JobPosting,
  Organization,
  PricingPlan,
  ResumeTemplate
};