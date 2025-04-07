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

// Register models
export const User = mongoose.model('User', userSchema);
export const Resume = mongoose.model('Resume', resumeSchema);
export const CoverLetter = mongoose.model('CoverLetter', coverLetterSchema);
export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
export const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
export const JobPosting = mongoose.model('JobPosting', jobPostingSchema);
export const Organization = mongoose.model('Organization', organizationSchema);
export const PricingPlan = mongoose.model('PricingPlan', pricingPlanSchema);

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
            'Limited Interview Questions'
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
            'AI Optimization'
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
            'Mock Interviews with AI Feedback',
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

// Connect to MongoDB
export async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    
    await mongoose.connect(MONGODB_URI);
    
    log('Connected to MongoDB', 'db');
    
    // Initialize pricing plans
    await initializePricingPlans();
    
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
  PricingPlan
};