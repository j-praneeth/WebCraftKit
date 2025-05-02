import {
  User, InsertUser, 
  Resume, InsertResume,
  ResumeTemplate, InsertResumeTemplate,
  CoverLetter, InsertCoverLetter,
  InterviewQuestion, InsertInterviewQuestion,
  MockInterview, InsertMockInterview,
  Organization, InsertOrganization,
  JobApplication, InsertJobApplication,
  JobPosting, InsertJobPosting
} from "@shared/schema";

export interface IStorage {
  getUserByUsername(username: string): Promise<User | undefined>;
  // User methods
  getUser(id: string | number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProvider(provider: string, providerId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string | number, data: Partial<User>): Promise<User | undefined>;
  updateMockInterviewCount(userId: string | number): Promise<number>;
  
  // Resume Template methods
  getResumeTemplate(id: number | string): Promise<ResumeTemplate | undefined>;
  getResumeTemplates(category?: string): Promise<ResumeTemplate[]>;
  createResumeTemplate(template: InsertResumeTemplate): Promise<ResumeTemplate>;
  
  // Resume methods
  getResume(id: number | string): Promise<Resume | undefined>;
  getResumesByUserId(userId: number | string): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number | string, data: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number | string): Promise<boolean>;
  
  // Cover Letter methods
  getCoverLetter(id: string | number): Promise<CoverLetter | undefined>;
  getCoverLettersByUserId(userId: string | number): Promise<CoverLetter[]>;
  createCoverLetter(coverLetter: InsertCoverLetter): Promise<CoverLetter>;
  updateCoverLetter(id: string | number, data: Partial<CoverLetter>): Promise<CoverLetter | undefined>;
  deleteCoverLetter(id: string | number): Promise<boolean>;
  
  // Interview Question methods
  getInterviewQuestion(id: string | number): Promise<InterviewQuestion | undefined>;
  getInterviewQuestionsByUserId(userId: string | number): Promise<InterviewQuestion[]>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  
  // Mock Interview methods
  getMockInterview(id: number | string): Promise<MockInterview | undefined>;
  getMockInterviewsByUserId(userId: string | number): Promise<MockInterview[]>;
  createMockInterview(interview: InsertMockInterview): Promise<MockInterview>;
  updateMockInterview(id: number | string, data: Partial<MockInterview>): Promise<MockInterview | undefined>;
  deleteMockInterview(id: number | string): Promise<boolean>;
  
  // Job Application methods
  getJobApplication(id: string | number): Promise<JobApplication | undefined>;
  getJobApplicationsByUserId(userId: string | number): Promise<JobApplication[]>;
  getJobApplicationsByJobId(jobId: string | number): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: string | number, data: Partial<JobApplication>): Promise<JobApplication | undefined>;
  deleteJobApplication(id: string | number): Promise<boolean>;
  
  // Organization methods
  getOrganization(id: string | number): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  
  // Job Posting methods
  getJobPosting(id: string | number): Promise<JobPosting | undefined>;
  getJobPostings(limit?: number): Promise<JobPosting[]>;
  createJobPosting?(job: InsertJobPosting): Promise<JobPosting>;
  
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
  private jobApplications: Map<number, JobApplication>;
  private applicationId: number;
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
    this.jobApplications = new Map();
    this.applicationId = 1;
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
  async getUser(id: string | number): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.users.get(numericId);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByProvider(provider: string, providerId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.provider === provider && user.providerId === providerId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const createdAt = new Date();
    
    // Create with proper default values for optional fields
    const user: User = {
      id,
      email: insertUser.email,
      password: insertUser.password ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      role: insertUser.role || 'user',
      plan: insertUser.plan || 'free',
      profilePicture: insertUser.profilePicture ?? null,
      mockInterviewsCount: 0,
      provider: insertUser.provider || 'local',
      providerId: insertUser.providerId ?? null,
      createdAt
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: string | number, data: Partial<User>): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const user = await this.getUser(numericId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(numericId, updatedUser);
    return updatedUser;
  }
  
  async updateMockInterviewCount(userId: string | number): Promise<number> {
    const numericId = typeof userId === 'string' ? parseInt(userId) : userId;
    const user = await this.getUser(numericId);
    if (!user) throw new Error("User not found");
    
    // Increment the count
    const currentCount = user.mockInterviewsCount || 0;
    const newCount = currentCount + 1;
    
    // Update the user
    await this.updateUser(numericId, { mockInterviewsCount: newCount });
    
    return newCount;
  }
  
  // Resume Template methods
  async getResumeTemplate(id: number | string): Promise<ResumeTemplate | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.resumeTemplates.get(numericId);
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
  async getResume(id: number | string): Promise<Resume | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.resumes.get(numericId);
  }
  
  async getResumesByUserId(userId: number | string): Promise<Resume[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === String(numericUserId),
    );
  }
  
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.resumeId++;
    const lastUpdated = new Date();
    
    const resume: Resume = {
      id,
      userId: String(insertResume.userId),
      title: insertResume.title,
      content: insertResume.content as unknown,
      templateId: insertResume.templateId ? String(insertResume.templateId) : null,
      atsScore: insertResume.atsScore ?? null,
      lastUpdated,
      isOptimized: insertResume.isOptimized ?? null
    };
    
    this.resumes.set(id, resume);
    return resume;
  }
  
  async updateResume(id: number | string, data: Partial<Resume>): Promise<Resume | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const resume = await this.getResume(numericId);
    if (!resume) return undefined;
    
    const updatedResume = { ...resume, ...data, lastUpdated: new Date() };
    this.resumes.set(numericId, updatedResume);
    return updatedResume;
  }
  
  async deleteResume(id: number | string): Promise<boolean> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.resumes.delete(numericId);
  }
  
  // Cover Letter methods
  async getCoverLetter(id: string | number): Promise<CoverLetter | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.coverLetters.get(numericId);
  }
  
  async getCoverLettersByUserId(userId: string | number): Promise<CoverLetter[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    return Array.from(this.coverLetters.values()).filter(
      (letter) => letter.userId === numericUserId,
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
  
  async updateCoverLetter(id: string | number, data: Partial<CoverLetter>): Promise<CoverLetter | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const letter = await this.getCoverLetter(numericId);
    if (!letter) return undefined;
    
    const updatedLetter = { ...letter, ...data, lastUpdated: new Date() };
    this.coverLetters.set(numericId, updatedLetter);
    return updatedLetter;
  }
  
  async deleteCoverLetter(id: string | number): Promise<boolean> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.coverLetters.delete(numericId);
  }
  
  // Interview Question methods
  async getInterviewQuestion(id: string | number): Promise<InterviewQuestion | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.interviewQuestions.get(numericId);
  }
  
  async getInterviewQuestionsByUserId(userId: string | number): Promise<InterviewQuestion[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    return Array.from(this.interviewQuestions.values()).filter(
      (question) => question.userId === numericUserId,
    );
  }
  
  async createInterviewQuestion(insertQuestion: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const id = this.questionId++;
    const createdAt = new Date();
    
    const question: InterviewQuestion = {
      id,
      userId: typeof insertQuestion.userId === 'string' ? parseInt(insertQuestion.userId) : insertQuestion.userId,
      createdAt,
      category: insertQuestion.category ?? null,
      question: insertQuestion.question,
      suggestedAnswer: insertQuestion.suggestedAnswer ?? null
    };
    
    this.interviewQuestions.set(id, question);
    return question;
  }
  
  // Mock Interview methods
  async getMockInterview(id: number | string): Promise<MockInterview | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.mockInterviews.get(numericId);
  }
  
  async getMockInterviewsByUserId(userId: string | number): Promise<MockInterview[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    return Array.from(this.mockInterviews.values()).filter(
      (interview) => interview.userId === String(numericUserId),
    );
  }
  
  async createMockInterview(insertInterview: InsertMockInterview): Promise<MockInterview> {
    const id = this.interviewId++;
    const date = new Date();
    
    const interview: MockInterview = {
      ...insertInterview,
      id,
      date,
      userId: String(insertInterview.userId),
      score: insertInterview.score ?? null,
      feedback: insertInterview.feedback ?? null,
      transcript: insertInterview.transcript ?? null,
      videoUrl: insertInterview.videoUrl ?? null
    };
    
    this.mockInterviews.set(id, interview);
    return interview;
  }

  async updateMockInterview(id: number | string, data: Partial<MockInterview>): Promise<MockInterview | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const interview = await this.getMockInterview(numericId);
    if (!interview) return undefined;
    
    const updatedInterview = { ...interview, ...data };
    this.mockInterviews.set(numericId, updatedInterview);
    return updatedInterview;
  }

  async deleteMockInterview(id: number | string): Promise<boolean> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.mockInterviews.delete(numericId);
  }
  
  // Job Application methods
  async getJobApplication(id: string | number): Promise<JobApplication | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.jobApplications.get(numericId);
  }

  async getJobApplicationsByUserId(userId: string | number): Promise<JobApplication[]> {
    const numericUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    return Array.from(this.jobApplications.values()).filter(
      (application) => application.userId === numericUserId,
    );
  }

  async getJobApplicationsByJobId(jobId: string | number): Promise<JobApplication[]> {
    const numericJobId = typeof jobId === 'string' ? parseInt(jobId) : jobId;
    return Array.from(this.jobApplications.values()).filter(
      (application) => application.jobId === numericJobId,
    );
  }

  async createJobApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const id = this.applicationId++;
    const appliedDate = insertApplication.appliedDate || new Date();
    
    const application: JobApplication = {
      id,
      userId: typeof insertApplication.userId === 'string' ? parseInt(insertApplication.userId) : insertApplication.userId,
      jobId: typeof insertApplication.jobId === 'string' ? parseInt(insertApplication.jobId) : insertApplication.jobId,
      resumeId: insertApplication.resumeId ? (typeof insertApplication.resumeId === 'string' ? parseInt(insertApplication.resumeId) : insertApplication.resumeId) : null,
      coverLetterId: insertApplication.coverLetterId ? (typeof insertApplication.coverLetterId === 'string' ? parseInt(insertApplication.coverLetterId) : insertApplication.coverLetterId) : null,
      status: insertApplication.status || 'applied',
      appliedDate,
      lastUpdated: appliedDate,
      notes: insertApplication.notes || null,
      feedback: insertApplication.feedback || null,
      interviews: insertApplication.interviews || []
    };
    
    this.jobApplications.set(id, application);
    return application;
  }

  async updateJobApplication(id: string | number, data: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    const application = await this.getJobApplication(numericId);
    if (!application) return undefined;
    
    const updatedApplication = { 
      ...application, 
      ...data,
      lastUpdated: new Date() 
    };
    
    this.jobApplications.set(numericId, updatedApplication);
    return updatedApplication;
  }

  async deleteJobApplication(id: string | number): Promise<boolean> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.jobApplications.delete(numericId);
  }
  
  // Organization methods
  async getOrganization(id: string | number): Promise<Organization | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id) : id;
    return this.organizations.get(numericId);
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
    // Create demo users
    const localUser: User = {
      id: this.userId++,
      email: 'alex@example.com',
      password: 'password123', // Would be hashed in a real app
      firstName: 'Alex',
      lastName: 'Morgan',
      role: 'user',
      plan: 'free',
      createdAt: new Date(),
      profilePicture: null,
      mockInterviewsCount: 0,
      provider: 'local',
      providerId: null
    };
    this.users.set(localUser.id, localUser);

    const googleUser: User = {
      id: this.userId++,
      email: 'sarah@gmail.com',
      password: null,
      firstName: 'Sarah',
      lastName: 'Smith',
      role: 'user',
      plan: 'free',
      createdAt: new Date(),
      profilePicture: 'https://lh3.googleusercontent.com/photo.jpg',
      mockInterviewsCount: 0,
      provider: 'google',
      providerId: 'google123'
    };
    this.users.set(googleUser.id, googleUser);

    const linkedinUser: User = {
      id: this.userId++,
      email: 'john@outlook.com',
      password: null,
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      plan: 'premium',
      createdAt: new Date(),
      profilePicture: 'https://media.linkedin.com/photo.jpg',
      mockInterviewsCount: 0,
      provider: 'linkedin',
      providerId: 'linkedin456'
    };
    this.users.set(linkedinUser.id, linkedinUser);
    
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
      userId: String(localUser.id), // Keep as string for resumes
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
      templateId: '1', // Modern Professional template
      atsScore: 92,
      lastUpdated: new Date(),
      isOptimized: true
    };
    this.resumes.set(seniorDevResume.id, seniorDevResume);
    
    const pmResume: Resume = {
      id: this.resumeId++,
      userId: String(localUser.id),
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
      templateId: '2', // Executive Suite template
      atsScore: 68,
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      isOptimized: false
    };
    this.resumes.set(pmResume.id, pmResume);
    
    // Create some interview questions
    const questions = [
      {
        id: this.questionId++,
        userId: localUser.id,
        question: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
        suggestedAnswer: 'When describing a challenging project, use the STAR method: Situation, Task, Action, and Result. Focus on how you identified problems, collaborated with team members, and implemented solutions that led to successful outcomes.',
        category: 'behavioral',
        createdAt: new Date()
      },
      {
        id: this.questionId++,
        userId: localUser.id,  // Already a number from creation
        question: 'What experience do you have with agile development methodologies?',
        suggestedAnswer: 'Describe your specific experience with agile frameworks like Scrum or Kanban. Mention your role in sprint planning, daily standups, and retrospectives. Highlight how you have used agile principles to improve team productivity and product quality.',
        category: 'technical',
        createdAt: new Date()
      },
      {
        id: this.questionId++,
        userId: localUser.id,
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
      userId: String(localUser.id), // Keep as string for mock interviews
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
    
    const applications = [
      {
        id: this.applicationId++,
        userId: 1, // Alex Morgan's ID
        jobId: 1, // Senior Frontend Developer job
        resumeId: 1, // Senior Developer Resume
        coverLetterId: null,
        status: 'interviewing',
        appliedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        notes: "Received positive feedback from the initial screening. Technical interview scheduled for next week.",
        feedback: null,
        interviews: [
          {
            type: "Technical Screening",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            notes: "Discussed React experience and system design approaches."
          }
        ]
      },
      {
        id: this.applicationId++,
        userId: 1, // Alex Morgan's ID
        jobId: 3, // DevOps Engineer job
        resumeId: 1, // Senior Developer Resume
        coverLetterId: null,
        status: 'applied',
        appliedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        notes: "Applied with customized resume highlighting AWS and Docker experience.",
        feedback: null,
        interviews: []
      },
      {
        id: this.applicationId++,
        userId: 2, // Sarah Smith's ID
        jobId: 2, // Full Stack Engineer job
        resumeId: null,
        coverLetterId: null,
        status: 'rejected',
        appliedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        notes: "Received rejection email citing lack of MongoDB experience.",
        feedback: "Thank you for your interest, but we are looking for candidates with more experience in MongoDB.",
        interviews: []
      }
    ];
    
    applications.forEach(app => this.jobApplications.set(app.id, app));
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
