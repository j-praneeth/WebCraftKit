import { 
  User, InsertUser, 
  Resume, InsertResume,
  ResumeTemplate, InsertResumeTemplate,
  CoverLetter, InsertCoverLetter,
  InterviewQuestion, InsertInterviewQuestion,
  MockInterview, InsertMockInterview,
  JobPosting, InsertJobPosting,
  Organization, InsertOrganization
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateMockInterviewCount(userId: number): Promise<number>;
  
  // Resume Template methods
  getResumeTemplate(id: number): Promise<ResumeTemplate | undefined>;
  getResumeTemplates(category?: string): Promise<ResumeTemplate[]>;
  createResumeTemplate(template: InsertResumeTemplate): Promise<ResumeTemplate>;
  
  // Resume methods
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUserId(userId: number): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;
  
  // Cover Letter methods
  getCoverLetter(id: number): Promise<CoverLetter | undefined>;
  getCoverLettersByUserId(userId: number): Promise<CoverLetter[]>;
  createCoverLetter(coverLetter: InsertCoverLetter): Promise<CoverLetter>;
  updateCoverLetter(id: number, data: Partial<CoverLetter>): Promise<CoverLetter | undefined>;
  deleteCoverLetter(id: number): Promise<boolean>;
  
  // Interview Question methods
  getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined>;
  getInterviewQuestionsByUserId(userId: number): Promise<InterviewQuestion[]>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  
  // Mock Interview methods
  getMockInterview(id: number): Promise<MockInterview | undefined>;
  getMockInterviewsByUserId(userId: number): Promise<MockInterview[]>;
  createMockInterview(interview: InsertMockInterview): Promise<MockInterview>;
  updateMockInterview(id: number, data: Partial<MockInterview>): Promise<MockInterview | undefined>;
  
  // Job Posting methods
  getJobPosting(id: number): Promise<JobPosting | undefined>;
  getJobPostings(limit?: number): Promise<JobPosting[]>;
  createJobPosting(job: InsertJobPosting): Promise<JobPosting>;
  
  // Organization methods
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  
  // Pricing Plan methods (optional)
  getPricingPlans?(): Promise<any[]>;
  getPricingPlanByName?(name: string): Promise<any | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumeTemplates: Map<number, ResumeTemplate>;
  private resumes: Map<number, Resume>;
  private coverLetters: Map<number, CoverLetter>;
  private interviewQuestions: Map<number, InterviewQuestion>;
  private mockInterviews: Map<number, MockInterview>;
  private jobPostings: Map<number, JobPosting>;
  private organizations: Map<number, Organization>;
  
  private userId: number;
  private templateId: number;
  private resumeId: number;
  private coverLetterId: number;
  private questionId: number;
  private interviewId: number;
  private jobId: number;
  private orgId: number;

  constructor() {
    this.users = new Map();
    this.resumeTemplates = new Map();
    this.resumes = new Map();
    this.coverLetters = new Map();
    this.interviewQuestions = new Map();
    this.mockInterviews = new Map();
    this.jobPostings = new Map();
    this.organizations = new Map();
    
    this.userId = 1;
    this.templateId = 1;
    this.resumeId = 1;
    this.coverLetterId = 1;
    this.questionId = 1;
    this.interviewId = 1;
    this.jobId = 1;
    this.orgId = 1;
    
    // Initialize with some dummy data
    this.initializeDummyData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    
    // Create with proper default values for optional fields
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      role: insertUser.role || 'user', 
      plan: insertUser.plan || 'free',
      profilePicture: insertUser.profilePicture ?? null,
      mockInterviewsCount: 0
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateMockInterviewCount(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    // Increment the count
    const currentCount = user.mockInterviewsCount || 0;
    const newCount = currentCount + 1;
    
    // Update the user
    await this.updateUser(userId, { mockInterviewsCount: newCount });
    
    return newCount;
  }
  
  // Resume Template methods
  async getResumeTemplate(id: number): Promise<ResumeTemplate | undefined> {
    return this.resumeTemplates.get(id);
  }
  
  async getResumeTemplates(category?: string): Promise<ResumeTemplate[]> {
    const templates = Array.from(this.resumeTemplates.values());
    if (category) {
      return templates.filter(template => template.category === category);
    }
    return templates;
  }
  
  async createResumeTemplate(insertTemplate: InsertResumeTemplate): Promise<ResumeTemplate> {
    const id = this.templateId++;
    const createdAt = new Date();
    
    const template: ResumeTemplate = {
      ...insertTemplate,
      id,
      createdAt,
      previewImage: insertTemplate.previewImage ?? null
    };
    
    this.resumeTemplates.set(id, template);
    return template;
  }
  
  // Resume methods
  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }
  
  async getResumesByUserId(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId,
    );
  }
  
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.resumeId++;
    const lastUpdated = new Date();
    
    const resume: Resume = { 
      ...insertResume, 
      id, 
      lastUpdated,
      templateId: insertResume.templateId ?? null,
      atsScore: insertResume.atsScore ?? null,
      isOptimized: insertResume.isOptimized ?? null 
    };
    
    this.resumes.set(id, resume);
    return resume;
  }
  
  async updateResume(id: number, data: Partial<Resume>): Promise<Resume | undefined> {
    const resume = await this.getResume(id);
    if (!resume) return undefined;
    
    const updatedResume = { ...resume, ...data, lastUpdated: new Date() };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }
  
  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }
  
  // Cover Letter methods
  async getCoverLetter(id: number): Promise<CoverLetter | undefined> {
    return this.coverLetters.get(id);
  }
  
  async getCoverLettersByUserId(userId: number): Promise<CoverLetter[]> {
    return Array.from(this.coverLetters.values()).filter(
      (letter) => letter.userId === userId,
    );
  }
  
  async createCoverLetter(insertCoverLetter: InsertCoverLetter): Promise<CoverLetter> {
    const id = this.coverLetterId++;
    const lastUpdated = new Date();
    
    const coverLetter: CoverLetter = { 
      ...insertCoverLetter, 
      id, 
      lastUpdated,
      jobTitle: insertCoverLetter.jobTitle ?? null,
      company: insertCoverLetter.company ?? null
    };
    
    this.coverLetters.set(id, coverLetter);
    return coverLetter;
  }
  
  async updateCoverLetter(id: number, data: Partial<CoverLetter>): Promise<CoverLetter | undefined> {
    const letter = await this.getCoverLetter(id);
    if (!letter) return undefined;
    
    const updatedLetter = { ...letter, ...data, lastUpdated: new Date() };
    this.coverLetters.set(id, updatedLetter);
    return updatedLetter;
  }
  
  async deleteCoverLetter(id: number): Promise<boolean> {
    return this.coverLetters.delete(id);
  }
  
  // Interview Question methods
  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    return this.interviewQuestions.get(id);
  }
  
  async getInterviewQuestionsByUserId(userId: number): Promise<InterviewQuestion[]> {
    return Array.from(this.interviewQuestions.values()).filter(
      (question) => question.userId === userId,
    );
  }
  
  async createInterviewQuestion(insertQuestion: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const id = this.questionId++;
    const createdAt = new Date();
    
    const question: InterviewQuestion = { 
      ...insertQuestion, 
      id, 
      createdAt,
      suggestedAnswer: insertQuestion.suggestedAnswer ?? null,
      category: insertQuestion.category ?? null
    };
    
    this.interviewQuestions.set(id, question);
    return question;
  }
  
  // Mock Interview methods
  async getMockInterview(id: number): Promise<MockInterview | undefined> {
    return this.mockInterviews.get(id);
  }
  
  async getMockInterviewsByUserId(userId: number): Promise<MockInterview[]> {
    return Array.from(this.mockInterviews.values()).filter(
      (interview) => interview.userId === userId,
    );
  }
  
  async createMockInterview(insertInterview: InsertMockInterview): Promise<MockInterview> {
    const id = this.interviewId++;
    const date = new Date();
    
    const interview: MockInterview = { 
      ...insertInterview, 
      id, 
      date,
      score: insertInterview.score ?? null, 
      feedback: insertInterview.feedback ?? null,
      transcript: insertInterview.transcript ?? null,
      videoUrl: insertInterview.videoUrl ?? null
    };
    
    this.mockInterviews.set(id, interview);
    return interview;
  }

  async updateMockInterview(id: number, data: Partial<MockInterview>): Promise<MockInterview | undefined> {
    const interview = await this.getMockInterview(id);
    if (!interview) return undefined;
    
    const updatedInterview = { ...interview, ...data };
    this.mockInterviews.set(id, updatedInterview);
    return updatedInterview;
  }
  
  // Job Posting methods
  async getJobPosting(id: number): Promise<JobPosting | undefined> {
    return this.jobPostings.get(id);
  }
  
  async getJobPostings(limit: number = 10): Promise<JobPosting[]> {
    const jobs = Array.from(this.jobPostings.values());
    return jobs.slice(0, limit);
  }
  
  async createJobPosting(insertJob: InsertJobPosting): Promise<JobPosting> {
    const id = this.jobId++;
    const postDate = new Date();
    
    const job: JobPosting = { 
      ...insertJob, 
      id, 
      postDate,
      location: insertJob.location ?? null,
      salary: insertJob.salary ?? null,
      description: insertJob.description ?? null,
      requirements: insertJob.requirements ?? null,
      source: insertJob.source ?? null,
      url: insertJob.url ?? null,
      matchScore: insertJob.matchScore ?? null
    };
    
    this.jobPostings.set(id, job);
    return job;
  }
  
  // Organization methods
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }
  
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = this.orgId++;
    const createdAt = new Date();
    
    const org: Organization = { 
      ...insertOrg, 
      id, 
      createdAt,
      subscription: insertOrg.subscription ?? null
    };
    
    this.organizations.set(id, org);
    return org;
  }
  
  // Initialize dummy data for demonstration
  private initializeDummyData() {
    // Create a demo user
    const demoUser: User = {
      id: this.userId++,
      username: 'alexmorgan',
      email: 'alex@example.com',
      password: 'password123', // Would be hashed in a real app
      firstName: 'Alex',
      lastName: 'Morgan',
      role: 'user',
      plan: 'free',
      createdAt: new Date(),
      profilePicture: null,
      mockInterviewsCount: 0
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create resume templates
    const templates = [
      {
        id: this.templateId++,
        name: 'Modern Professional',
        description: 'A clean, professional template with a sidebar for contact and skills',
        structure: {
          layout: 'sidebar-left',
          fontFamily: 'Inter, sans-serif',
          primaryColor: '#3b82f6',
          fontSize: 'medium'
        },
        category: 'free',
        previewImage: '/templates/modern-professional.png',
        createdAt: new Date()
      },
      {
        id: this.templateId++,
        name: 'Executive Suite',
        description: 'Elegant and sophisticated design for senior positions',
        structure: {
          layout: 'traditional',
          fontFamily: 'Georgia, serif',
          primaryColor: '#1e3a8a',
          fontSize: 'medium'
        },
        category: 'free',
        previewImage: '/templates/executive-suite.png',
        createdAt: new Date()
      },
      {
        id: this.templateId++,
        name: 'Creative Portfolio',
        description: 'Stand out with this modern creative template for design professionals',
        structure: {
          layout: 'grid',
          fontFamily: 'Poppins, sans-serif',
          primaryColor: '#8b5cf6',
          fontSize: 'medium'
        },
        category: 'premium',
        previewImage: '/templates/creative-portfolio.png',
        createdAt: new Date()
      },
      {
        id: this.templateId++,
        name: 'ATS Maximizer',
        description: 'Optimized for Applicant Tracking Systems with perfect keyword placement',
        structure: {
          layout: 'traditional',
          fontFamily: 'Arial, sans-serif',
          primaryColor: '#10b981',
          fontSize: 'medium'
        },
        category: 'premium',
        previewImage: '/templates/ats-maximizer.png',
        createdAt: new Date()
      },
      {
        id: this.templateId++,
        name: 'Tech Innovator',
        description: 'Modern template with skill bars and tech focus',
        structure: {
          layout: 'full-width',
          fontFamily: 'Roboto Mono, monospace',
          primaryColor: '#6366f1',
          fontSize: 'medium'
        },
        category: 'premium',
        previewImage: '/templates/tech-innovator.png',
        createdAt: new Date()
      }
    ];
    
    templates.forEach(template => this.resumeTemplates.set(template.id, template));
    
    // Create some demo resumes
    const seniorDevResume: Resume = {
      id: this.resumeId++,
      userId: demoUser.id,
      title: 'Senior Developer Resume',
      content: {
        personalInfo: {
          name: 'Alex Morgan',
          email: 'alex@example.com',
          phone: '555-123-4567',
          address: 'San Francisco, CA'
        },
        experience: [
          {
            company: 'Tech Solutions Inc',
            title: 'Senior Developer',
            startDate: '2020-01',
            endDate: 'Present',
            description: 'Lead development of web applications using React, Node.js, and AWS.'
          }
        ],
        education: [
          {
            institution: 'University of California',
            degree: 'BS Computer Science',
            year: '2018'
          }
        ],
        skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'Docker']
      },
      templateId: 1, // Modern Professional template
      atsScore: 92,
      lastUpdated: new Date(),
      isOptimized: true
    };
    this.resumes.set(seniorDevResume.id, seniorDevResume);
    
    const pmResume: Resume = {
      id: this.resumeId++,
      userId: demoUser.id,
      title: 'Project Manager CV',
      content: {
        personalInfo: {
          name: 'Alex Morgan',
          email: 'alex@example.com',
          phone: '555-123-4567',
          address: 'San Francisco, CA'
        },
        experience: [
          {
            company: 'Project Management Ltd',
            title: 'Project Manager',
            startDate: '2019-03',
            endDate: 'Present',
            description: 'Managed cross-functional teams and delivered projects on time and within budget.'
          }
        ],
        education: [
          {
            institution: 'University of California',
            degree: 'BS Computer Science',
            year: '2018'
          },
          {
            institution: 'PMI',
            degree: 'Project Management Professional (PMP)',
            year: '2020'
          }
        ],
        skills: ['Project Management', 'Agile', 'Scrum', 'Budgeting', 'Team Leadership']
      },
      templateId: 2, // Executive Suite template
      atsScore: 68,
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      isOptimized: false
    };
    this.resumes.set(pmResume.id, pmResume);
    
    // Create some interview questions
    const questions = [
      {
        id: this.questionId++,
        userId: demoUser.id,
        question: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
        suggestedAnswer: 'When describing a challenging project, use the STAR method: Situation, Task, Action, and Result. Focus on how you identified problems, collaborated with team members, and implemented solutions that led to successful outcomes.',
        category: 'behavioral',
        createdAt: new Date()
      },
      {
        id: this.questionId++,
        userId: demoUser.id,
        question: 'What experience do you have with agile development methodologies?',
        suggestedAnswer: 'Describe your specific experience with agile frameworks like Scrum or Kanban. Mention your role in sprint planning, daily standups, and retrospectives. Highlight how you have used agile principles to improve team productivity and product quality.',
        category: 'technical',
        createdAt: new Date()
      },
      {
        id: this.questionId++,
        userId: demoUser.id,
        question: 'How do you handle conflicts within a team?',
        suggestedAnswer: 'Explain your approach to conflict resolution: listening actively to all perspectives, focusing on facts rather than emotions, finding common ground, and working toward mutually beneficial solutions. Provide a specific example that demonstrates your conflict resolution skills.',
        category: 'behavioral',
        createdAt: new Date()
      }
    ];
    
    questions.forEach(q => this.interviewQuestions.set(q.id, q));
    
    // Create a mock interview result
    const mockInterview: MockInterview = {
      id: this.interviewId++,
      userId: demoUser.id,
      title: 'Full Stack Developer Interview',
      score: 76,
      feedback: {
        strengths: ['Clear communication', 'Technical knowledge', 'Problem-solving approach'],
        improvements: ['Could provide more detailed examples', 'Work on eye contact', 'Speak with more confidence'],
        overall: 'Good performance with room for improvement in delivery and confidence.'
      },
      date: new Date('2023-05-12'),
      transcript: "Interviewer: Tell me about your experience with React.\n\nCandidate: I've been working with React for 3 years, building complex web applications with state management using Redux and more recently React Query...",
      videoUrl: null
    };
    this.mockInterviews.set(mockInterview.id, mockInterview);
    
    // Create some job postings
    const jobs = [
      {
        id: this.jobId++,
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA (Remote)',
        salary: '$120K - $150K',
        description: "We are looking for an experienced Frontend Developer with React expertise to join our growing team. In this role, you will work closely with designers and backend developers to create intuitive and responsive user interfaces.",
        requirements: ['React', 'TypeScript', 'Next.js'],
        postDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        source: 'LinkedIn',
        url: 'https://example.com/jobs/1',
        matchScore: 98
      },
      {
        id: this.jobId++,
        title: 'Full Stack Engineer',
        company: 'InnovateX',
        location: 'New York, NY (Hybrid)',
        salary: '$110K - $140K',
        description: "Join our team as a Full Stack Engineer to build and maintain web applications. You will be responsible for both frontend and backend development, working with modern technologies and frameworks.",
        requirements: ['Node.js', 'React', 'MongoDB'],
        postDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        source: 'Indeed',
        url: 'https://example.com/jobs/2',
        matchScore: 95
      },
      {
        id: this.jobId++,
        title: 'DevOps Engineer',
        company: 'CloudSys Technologies',
        location: 'Boston, MA (Remote)',
        salary: '$130K - $160K',
        description: "We are seeking a DevOps Engineer to help us build and maintain our cloud infrastructure. You will work on CI/CD pipelines, infrastructure as code, and ensure high availability of our systems.",
        requirements: ['AWS', 'Kubernetes', 'Terraform'],
        postDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        source: 'LinkedIn',
        url: 'https://example.com/jobs/3',
        matchScore: 85
      }
    ];
    
    jobs.forEach(job => this.jobPostings.set(job.id, job));
  }
}

import { MongoStorage } from './mongo-storage';

// Main storage variable - can switch between MemStorage and MongoStorage
let storageImplementation: IStorage;

// Try to use MongoDB, but fall back to in-memory storage if it fails
try {
  storageImplementation = new MongoStorage();
  console.log('Using MongoDB storage');
} catch (error) {
  console.warn('Error initializing MongoDB storage, falling back to in-memory storage:', error);
  storageImplementation = new MemStorage();
  console.log('Using in-memory storage');
}

export const storage = storageImplementation;
