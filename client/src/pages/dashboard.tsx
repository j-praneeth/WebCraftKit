import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ResumeCard, NewResumeCard } from "@/components/dashboard/resume-card";
import { InterviewQuestionsCard, MockInterviewCard } from "@/components/dashboard/interview-card";
import { JobCard } from "@/components/dashboard/job-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Resume, InterviewQuestion, MockInterview, JobPosting } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch resumes
  const { 
    data: resumes,
    isLoading: isLoadingResumes 
  } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });

  // Fetch interview questions
  const { 
    data: questions,
    isLoading: isLoadingQuestions 
  } = useQuery<InterviewQuestion[]>({
    queryKey: ["/api/interview-questions"],
    enabled: !!user,
  });

  // Fetch mock interviews
  const { 
    data: interviews,
    isLoading: isLoadingInterviews 
  } = useQuery<MockInterview[]>({
    queryKey: ["/api/mock-interviews"],
    enabled: !!user,
  });

  // Fetch job postings
  const { 
    data: jobs,
    isLoading: isLoadingJobs 
  } = useQuery<JobPosting[]>({
    queryKey: ["/api/jobs"],
  });

  // Handlers
  const handleEditResume = (id: number) => {
    navigate(`/resume-builder/${id}`);
  };

  const handleDownloadResume = (id: number) => {
    toast({
      title: "Download started",
      description: "Your resume is being prepared for download.",
    });
  };

  const handleCreateNewResume = () => {
    navigate("/resume-builder/new");
  };

  const handleShowSuggestion = (questionId: number) => {
    const question = questions?.find(q => q.id === questionId);
    if (question) {
      toast({
        title: "Suggested Answer",
        description: question.suggestedAnswer || "No suggestion available",
        duration: 8000,
      });
    }
  };

  const handleGenerateMoreQuestions = () => {
    toast({
      title: "Generating questions",
      description: "AI is analyzing your profile to generate relevant questions.",
    });
    navigate("/interview-prep");
  };

  const handleStartMockInterview = () => {
    navigate("/mock-interviews/new");
  };

  const handleSaveJob = (jobId: number) => {
    toast({
      title: "Job saved",
      description: "This job has been saved to your favorites.",
    });
  };

  const handleApplyJob = (jobId: number) => {
    toast({
      title: "Application started",
      description: "You're being redirected to complete your application.",
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-8 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Welcome back, {user?.firstName || user?.username?.split(' ')[0] || "User"}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Let's continue improving your job search toolkit
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleCreateNewResume} className="ml-3 flex items-center">
            <i className="ri-add-line mr-1"></i> New Resume
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="mt-8">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Your Progress</h2>
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="ATS Score"
            value="85%"
            change="12%"
            changeType="increase"
            icon="ri-file-search-line"
            iconBgColor="bg-primary-100"
            iconColor="text-primary-600"
          />
          <StatsCard
            title="Resume Views"
            value="24"
            change="8"
            changeType="increase"
            icon="ri-eye-line"
            iconBgColor="bg-secondary-100"
            iconColor="text-secondary-600"
          />
          <StatsCard
            title="Interview Readiness"
            value="70%"
            change="5%"
            changeType="increase"
            icon="ri-user-voice-line"
            iconBgColor="bg-accent-100"
            iconColor="text-accent-600"
          />
          <StatsCard
            title="Job Match Score"
            value="92%"
            change="3%"
            changeType="increase"
            icon="ri-award-line"
            iconBgColor="bg-gray-100"
            iconColor="text-gray-600"
          />
        </div>
      </div>

      {/* Resume Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Your Resumes</h2>
          <div>
            <Button variant="outline" size="sm" onClick={() => navigate("/resume-builder")}>
              View All
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingResumes ? (
            <div className="col-span-3 flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <>
              {resumes?.map(resume => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onEdit={handleEditResume}
                  onDownload={handleDownloadResume}
                />
              ))}
              <NewResumeCard onClick={handleCreateNewResume} />
            </>
          )}
        </div>
      </div>

      {/* Interview Preparation Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Interview Preparation</h2>
          <div>
            <Button variant="outline" size="sm" onClick={() => navigate("/interview-prep")}>
              View All
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InterviewQuestionsCard 
            questions={questions || []}
            onGenerateMore={handleGenerateMoreQuestions}
            onShowSuggestion={handleShowSuggestion}
          />
          
          <MockInterviewCard 
            latestInterview={interviews?.[0]}
            onStartMockInterview={handleStartMockInterview}
          />
        </div>
      </div>

      {/* Job Matches Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Recommended Job Matches</h2>
          <div>
            <Button variant="outline" size="sm" onClick={() => navigate("/job-matching")}>
              View All
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingJobs ? (
            <div className="col-span-3 flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            jobs?.slice(0, 3).map(job => (
              <JobCard 
                key={job.id}
                job={job}
                onSave={handleSaveJob}
                onApply={handleApplyJob}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;
