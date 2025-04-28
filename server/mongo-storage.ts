import {
  User as UserModel,
  Resume as ResumeModel,
  CoverLetter as CoverLetterModel,
  InterviewQuestion as InterviewQuestionModel,
  MockInterview as MockInterviewModel,
  JobPosting as JobPostingModel,
  Organization as OrganizationModel,
  PricingPlan as PricingPlanModel,
  ResumeTemplate as ResumeTemplateModel
} from './db';

import { 
  User, 
  Resume, 
  CoverLetter, 
  InterviewQuestion, 
  MockInterview, 
  JobPosting, 
  Organization, 
  ResumeTemplate,
  InsertUser, 
  InsertResume, 
  InsertCoverLetter, 
  InsertInterviewQuestion, 
  InsertMockInterview, 
  InsertJobPosting, 
  InsertOrganization,
  InsertResumeTemplate
} from '../shared/schema';

import { IStorage } from './storage';
import mongoose from 'mongoose';

export class MongoStorage implements IStorage {
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      if (!user) return undefined;
      
      return this.convertMongoUserToSchemaUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      if (!user) return undefined;
      
      return this.convertMongoUserToSchemaUser(user);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) return undefined;
      
      return this.convertMongoUserToSchemaUser(user);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = new UserModel(insertUser);
      const savedUser = await user.save();
      
      return this.convertMongoUserToSchemaUser(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    try {
      // Convert number ID to string for MongoDB
      const userId = id.toString();
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { ...data, updatedAt: new Date() },
        { new: true }
      );
      if (!user) return undefined;
      
      return this.convertMongoUserToSchemaUser(user);
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }
  
  async updateMockInterviewCount(userId: number): Promise<number> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error("User not found");
      
      // Increment the count
      const currentCount = user.mockInterviewsCount || 0;
      const newCount = currentCount + 1;
      
      // Update the user
      user.mockInterviewsCount = newCount;
      await user.save();
      
      return newCount;
    } catch (error) {
      console.error('Error updating mock interview count:', error);
      throw new Error("Failed to update mock interview count");
    }
  }
  
  // Resume Template methods
  async getResumeTemplate(id: number | string): Promise<ResumeTemplate | undefined> {
    try {
      // Try to find by direct ID first (for MongoDB ObjectIds)
      try {
        const template = await ResumeTemplateModel.findById(String(id));
        if (template) return this.convertMongoResumeTemplateToSchemaResumeTemplate(template);
      } catch (idError) {
        console.log(`Template not found with direct ID lookup: ${id}`, idError);
      }
      
      // Try to find by numeric ID (backward compatibility)
      if (typeof id === 'number' || !isNaN(Number(id))) {
        const numericId = Number(id);
        const templateByNumericId = await ResumeTemplateModel.findOne({ id: numericId });
        if (templateByNumericId) return this.convertMongoResumeTemplateToSchemaResumeTemplate(templateByNumericId);
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting resume template:', error);
      return undefined;
    }
  }
  
  async getResumeTemplates(category?: string): Promise<ResumeTemplate[]> {
    try {
      let query = category ? { category } : {};
      const templates = await ResumeTemplateModel.find(query);
      return templates.map(t => this.convertMongoResumeTemplateToSchemaResumeTemplate(t));
    } catch (error) {
      console.error('Error getting resume templates:', error);
      return [];
    }
  }
  
  async createResumeTemplate(insertTemplate: InsertResumeTemplate): Promise<ResumeTemplate> {
    try {
      const template = new ResumeTemplateModel(insertTemplate);
      const savedTemplate = await template.save();
      
      return this.convertMongoResumeTemplateToSchemaResumeTemplate(savedTemplate);
    } catch (error) {
      console.error('Error creating resume template:', error);
      throw new Error('Failed to create resume template');
    }
  }

  // Resume methods
  async getResume(id: number | string): Promise<Resume | undefined> {
    try {
      // Try to find by direct ID first (for MongoDB ObjectIds)
      try {
        const resume = await ResumeModel.findById(String(id));
        if (resume) return this.convertMongoResumeToSchemaResume(resume);
      } catch (idError) {
        console.log(`Resume not found with direct ID lookup: ${id}`, idError);
        // Continue to try other methods if this fails
      }
      
      // Try to find by numeric ID (backward compatibility)
      if (typeof id === 'number' || !isNaN(Number(id))) {
        const numericId = Number(id);
        const resumeByNumericId = await ResumeModel.findOne({ id: numericId });
        if (resumeByNumericId) return this.convertMongoResumeToSchemaResume(resumeByNumericId);
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting resume:', error);
      return undefined;
    }
  }

  async getResumesByUserId(userId: number | string): Promise<Resume[]> {
    try {
      const resumes = await ResumeModel.find({ userId });
      
      return resumes.map(resume => this.convertMongoResumeToSchemaResume(resume));
    } catch (error) {
      console.error('Error getting resumes by user ID:', error);
      return [];
    }
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    try {
      // Don't convert userId here - let Mongoose handle the conversion in the schema
      // Only create a clean document without excessive type conversions
      // The MongoDB schema already handles the conversion appropriately
      console.log('Creating resume with data:', insertResume);
      
      // Create a new resume document
      const resume = new ResumeModel({
        ...insertResume
      });
      
      const savedResume = await resume.save();
      console.log('Resume saved successfully:', savedResume);
      
      return this.convertMongoResumeToSchemaResume(savedResume);
    } catch (error: any) {
      console.error('Error creating resume:', error);
      throw new Error(`Failed to create resume: ${error?.message || 'Unknown error'}`);
    }
  }

  async updateResume(id: number | string, data: Partial<Resume>): Promise<Resume | undefined> {
    try {
      console.log('Updating resume with ID:', id, 'Data:', data);
      const resume = await ResumeModel.findByIdAndUpdate(
        String(id),
        { $set: data },
        { new: true }
      );
      if (!resume) {
        console.log('No resume found with ID:', id);
        return undefined;
      }
      
      console.log('Resume updated successfully:', resume);
      return this.convertMongoResumeToSchemaResume(resume);
    } catch (error) {
      console.error('Error updating resume:', error);
      return undefined;
    }
  }

  async deleteResume(id: number | string): Promise<boolean> {
    try {
      const result = await ResumeModel.findByIdAndDelete(String(id));
      return !!result;
    } catch (error) {
      console.error('Error deleting resume:', error);
      return false;
    }
  }

  // Cover Letter methods
  async getCoverLetter(id: number): Promise<CoverLetter | undefined> {
    try {
      const coverLetter = await CoverLetterModel.findById(id);
      if (!coverLetter) return undefined;
      
      return this.convertMongoCoverLetterToSchemaCoverLetter(coverLetter);
    } catch (error) {
      console.error('Error getting cover letter:', error);
      return undefined;
    }
  }

  async getCoverLettersByUserId(userId: number): Promise<CoverLetter[]> {
    try {
      const coverLetters = await CoverLetterModel.find({ userId });
      
      return coverLetters.map(coverLetter => 
        this.convertMongoCoverLetterToSchemaCoverLetter(coverLetter)
      );
    } catch (error) {
      console.error('Error getting cover letters by user ID:', error);
      return [];
    }
  }

  async createCoverLetter(insertCoverLetter: InsertCoverLetter): Promise<CoverLetter> {
    try {
      // Convert userId to string and validate it's a valid ObjectId
      const userId = String(insertCoverLetter.userId);
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
      }

      // Create new cover letter with converted userId
      const coverLetter = new CoverLetterModel({
        ...insertCoverLetter,
        userId: new mongoose.Types.ObjectId(userId)
      });
      
      const savedCoverLetter = await coverLetter.save();
      return this.convertMongoCoverLetterToSchemaCoverLetter(savedCoverLetter);
    } catch (error) {
      console.error('Error creating cover letter:', error);
      throw new Error('Failed to create cover letter');
    }
  }

  async updateCoverLetter(id: number, data: Partial<CoverLetter>): Promise<CoverLetter | undefined> {
    try {
      const coverLetter = await CoverLetterModel.findByIdAndUpdate(id, data, { new: true });
      if (!coverLetter) return undefined;
      
      return this.convertMongoCoverLetterToSchemaCoverLetter(coverLetter);
    } catch (error) {
      console.error('Error updating cover letter:', error);
      return undefined;
    }
  }

  async deleteCoverLetter(id: number): Promise<boolean> {
    try {
      const result = await CoverLetterModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting cover letter:', error);
      return false;
    }
  }

  // Interview Question methods
  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    try {
      const question = await InterviewQuestionModel.findById(id);
      if (!question) return undefined;
      
      return this.convertMongoInterviewQuestionToSchemaInterviewQuestion(question);
    } catch (error) {
      console.error('Error getting interview question:', error);
      return undefined;
    }
  }

  async getInterviewQuestionsByUserId(userId: number): Promise<InterviewQuestion[]> {
    try {
      const questions = await InterviewQuestionModel.find({ userId });
      
      return questions.map(question => 
        this.convertMongoInterviewQuestionToSchemaInterviewQuestion(question)
      );
    } catch (error) {
      console.error('Error getting interview questions by user ID:', error);
      return [];
    }
  }

  async createInterviewQuestion(insertQuestion: InsertInterviewQuestion): Promise<InterviewQuestion> {
    try {
      // Ensure userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(insertQuestion.userId)) {
        insertQuestion.userId = new mongoose.Types.ObjectId().toString();
      }
      
      const question = new InterviewQuestionModel(insertQuestion);
      const savedQuestion = await question.save();
      
      return this.convertMongoInterviewQuestionToSchemaInterviewQuestion(savedQuestion);
    } catch (error) {
      console.error('Error creating interview question:', error);
      throw new Error('Failed to create interview question');
    }
  }

  // Mock Interview methods
  async getMockInterview(id: number | string): Promise<MockInterview | undefined> {
    try {
      // Convert the id to string to ensure it's treated as an ObjectId string
      const interview = await MockInterviewModel.findById(String(id));
      if (!interview) return undefined;
      
      return this.convertMongoMockInterviewToSchemaMockInterview(interview);
    } catch (error) {
      console.error('Error getting mock interview:', error);
      return undefined;
    }
  }

  async getMockInterviewsByUserId(userId: number): Promise<MockInterview[]> {
    try {
      const interviews = await MockInterviewModel.find({ userId });
      
      return interviews.map(interview => 
        this.convertMongoMockInterviewToSchemaMockInterview(interview)
      );
    } catch (error) {
      console.error('Error getting mock interviews by user ID:', error);
      return [];
    }
  }

  async createMockInterview(insertInterview: InsertMockInterview): Promise<MockInterview> {
    try {
      const interview = new MockInterviewModel(insertInterview);
      const savedInterview = await interview.save();
      
      return this.convertMongoMockInterviewToSchemaMockInterview(savedInterview);
    } catch (error) {
      console.error('Error creating mock interview:', error);
      throw new Error('Failed to create mock interview');
    }
  }

  async updateMockInterview(id: number | string, data: Partial<MockInterview>): Promise<MockInterview | undefined> {
    try {
      // Convert the id to string to ensure it's treated as an ObjectId string
      const interview = await MockInterviewModel.findByIdAndUpdate(
        String(id),
        { $set: data },
        { new: true } // Return the updated document
      );
      
      if (!interview) {
        console.error(`No interview found with ID: ${id}`);
        return undefined;
      }
      
      return this.convertMongoMockInterviewToSchemaMockInterview(interview);
    } catch (error) {
      console.error('Error updating mock interview:', error);
      return undefined;
    }
  }

  async deleteMockInterview(id: number | string): Promise<boolean> {
    try {
      const result = await MockInterviewModel.findByIdAndDelete(String(id));
      return !!result;
    } catch (error) {
      console.error('Error deleting mock interview:', error);
      return false;
    }
  }

  // Job Posting methods
  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    try {
      const job = await JobPostingModel.findById(id);
      if (!job) return undefined;
      
      return this.convertMongoJobPostingToSchemaJobPosting(job);
    } catch (error) {
      console.error('Error getting job posting:', error);
      return undefined;
    }
  }

  async getJobPostings(limit: number = 10): Promise<JobPosting[]> {
    try {
      const jobs = await JobPostingModel.find().limit(limit);
      
      return jobs.map(job => this.convertMongoJobPostingToSchemaJobPosting(job));
    } catch (error) {
      console.error('Error getting job postings:', error);
      return [];
    }
  }

  async createJobPosting(insertJob: InsertJobPosting): Promise<JobPosting> {
    try {
      const job = new JobPostingModel(insertJob);
      const savedJob = await job.save();
      
      return this.convertMongoJobPostingToSchemaJobPosting(savedJob);
    } catch (error) {
      console.error('Error creating job posting:', error);
      throw new Error('Failed to create job posting');
    }
  }

  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    try {
      const org = await OrganizationModel.findById(id);
      if (!org) return undefined;
      
      return this.convertMongoOrganizationToSchemaOrganization(org);
    } catch (error) {
      console.error('Error getting organization:', error);
      return undefined;
    }
  }

  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    try {
      const org = new OrganizationModel(insertOrg);
      const savedOrg = await org.save();
      
      return this.convertMongoOrganizationToSchemaOrganization(savedOrg);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw new Error('Failed to create organization');
    }
  }

  // Additional methods for pricing plans
  async getPricingPlans(): Promise<any[]> {
    try {
      return await PricingPlanModel.find().lean();
    } catch (error) {
      console.error('Error getting pricing plans:', error);
      return [];
    }
  }

  async getPricingPlanByName(name: string): Promise<any | undefined> {
    try {
      const plan = await PricingPlanModel.findOne({ name }).lean();
      return plan || undefined;
    } catch (error) {
      console.error('Error getting pricing plan by name:', error);
      return undefined;
    }
  }

  // Helper methods to convert MongoDB documents to schema types
  private convertMongoUserToSchemaUser(user: any): User {
    return {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      plan: user.plan,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      mockInterviewsCount: user.mockInterviewsCount || 0,
      atsScore: user.atsScore || 0,
      lastAtsUpdate: user.lastAtsUpdate || null,
      provider: user.provider || null,
      providerId: user.providerId || null,
      jobMatchScore: user.jobMatchScore || 0,
      lastJobMatch: user.lastJobMatch || null
    };
  }
  
  private convertMongoResumeTemplateToSchemaResumeTemplate(template: any): ResumeTemplate {
    return {
      id: template._id.toString(),
      name: template.name,
      description: template.description,
      structure: template.structure,
      category: template.category,
      previewImage: template.previewImage || null,
      createdAt: template.createdAt
    };
  }

  private convertMongoResumeToSchemaResume(resume: any): Resume {
    return {
      id: resume._id.toString(),
      userId: resume.userId.toString(),
      title: resume.title,
      content: resume.content,
      templateId: resume.templateId || null,
      atsScore: resume.atsScore,
      lastUpdated: resume.lastUpdated || resume.createdAt,
      isOptimized: resume.isOptimized
    };
  }

  private convertMongoCoverLetterToSchemaCoverLetter(coverLetter: any): CoverLetter {
    return {
      id: coverLetter._id.toString(),
      userId: coverLetter.userId.toString(),
      title: coverLetter.title,
      content: coverLetter.content,
      jobTitle: coverLetter.jobTitle,
      company: coverLetter.company,
      lastUpdated: coverLetter.lastUpdated || coverLetter.createdAt
    };
  }

  private convertMongoInterviewQuestionToSchemaInterviewQuestion(question: any): InterviewQuestion {
    return {
      id: question._id.toString(),
      userId: question.userId.toString(),
      question: question.question,
      suggestedAnswer: question.suggestedAnswer,
      category: question.category,
      createdAt: question.createdAt
    };
  }

  private convertMongoMockInterviewToSchemaMockInterview(interview: any): MockInterview {
    return {
      id: interview._id.toString(),
      userId: interview.userId.toString(),
      title: interview.title,
      score: interview.score,
      feedback: interview.feedback,
      transcript: interview.transcript || null,
      videoUrl: interview.videoUrl || null,
      date: interview.date || interview.createdAt
    };
  }

  private convertMongoJobPostingToSchemaJobPosting(job: any): JobPosting {
    return {
      id: job._id.toString(),
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary: job.salary,
      requirements: job.requirements,
      postDate: job.postDate || job.posted,
      source: job.source,
      url: job.url,
      matchScore: job.matchScore
    };
  }

  private convertMongoOrganizationToSchemaOrganization(org: any): Organization {
    return {
      id: org._id.toString(),
      name: org.name,
      contactEmail: org.contactEmail,
      subscription: org.subscription,
      createdAt: org.createdAt
    };
  }
}

// Export a singleton instance of the MongoDB storage implementation
export const storage = new MongoStorage();