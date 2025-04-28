import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ResumeCard, NewResumeCard } from "@/components/dashboard/resume-card";
import { InterviewQuestionsCard, MockInterviewCard } from "@/components/dashboard/interview-card";
import { JobCard } from "@/components/dashboard/job-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Resume, InterviewQuestion, MockInterview, JobPosting } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface UserStatsResponse {
  jobMatchScore: number;
  lastJobMatch: string;
  mockInterviewsCount: number;
  atsScore: number;
  lastAtsUpdate: string;
}

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

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (id: string | number) => {
      await apiRequest("DELETE", `/api/resumes/${id}`);
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/resumes"] });

      // Snapshot the previous value
      const previousResumes = queryClient.getQueryData<Resume[]>(["/api/resumes"]);

      // Optimistically update to the new value
      if (previousResumes) {
        queryClient.setQueryData<Resume[]>(["/api/resumes"],
          previousResumes.filter(resume => resume.id !== deletedId)
        );
      }

      return { previousResumes };
    },
    onSuccess: () => {
      toast({
        title: "Resume deleted",
        description: "Your resume has been deleted successfully.",
      });
    },
    onError: (error: any, _, context: any) => {
      // Rollback to the previous value on error
      if (context?.previousResumes) {
        queryClient.setQueryData(["/api/resumes"], context.previousResumes);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      // Refetch after error or success to ensure cache is in sync
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] }),
        queryClient.refetchQueries({ queryKey: ["/api/resumes"] })
      ]);
    },
  });

  const handleDeleteResume = (id: string | number) => {
    if (window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      deleteResumeMutation.mutate(id);
    }
  };

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
    enabled: !!user,
  });

  // Fetch user stats
  const {
    data: userStats,
    isLoading: isLoadingStats
  } = useQuery<UserStatsResponse>({
    queryKey: ["/api/user/stats"],
    queryFn: async () => {
      const response = await fetch('/api/user/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      console.log('User stats response:', data); // Add logging to debug
      return data;
    },
    enabled: !!user,
  });

  // Handlers
  const handleEditResume = (id: string | number) => {
    navigate(`/resume-builder/${id}`);
  };

  const handleDownloadResume = (id: string | number) => {
    toast({
      title: "Download started",
      description: "Your resume is being prepared for download.",
    });
  };

  const handleCreateNewResume = () => {
    navigate("/resume-builder/new");
  };

  const handleShowSuggestion = (questionId: string | number) => {
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
    navigate("/mock-interviews");
  };

  const handleSaveJob = (jobId: string | number) => {
    toast({
      title: "Job saved",
      description: "This job has been saved to your favorites.",
    });
  };

  const handleApplyJob = (jobId: string | number) => {
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
        <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2">
         {isLoadingStats ? (
           Array(2).fill(0).map((_, i) => (
             <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-6 animate-pulse">
               <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
               <div className="h-8 bg-gray-200 rounded w-1/4"></div>
             </div>
           ))
         ) : (
           <>
             <StatsCard
               title="Job Match Score"
               value={`${userStats?.jobMatchScore ?? 0}%`}
               change={userStats?.lastJobMatch ? new Date(userStats.lastJobMatch).toLocaleDateString() : 'Not available'}
               changeType="neutral"
               icon="ri-award-line"
               iconBgColor="bg-primary-100"
               iconColor="text-primary-600"
             />
             <StatsCard
               title="ATS Score"
               value={`${userStats?.atsScore ?? 0}%`}
              //  change={userStats?.lastAtsUpdate ? new Date(userStats.lastAtsUpdate).toLocaleDateString() : 'Not available'}
               changeType="neutral"
               icon="ri-award-line"
               iconBgColor="bg-primary-100"
               iconColor="text-primary-600"
             />
             <StatsCard
               title="Mock Interviews"
               value={userStats?.mockInterviewsCount ?? 0}
               change={userStats?.mockInterviewsCount === 3 ? 'Max limit reached' : `${3 - (userStats?.mockInterviewsCount ?? 0)} remaining`}
               changeType="neutral"
               icon="ri-user-voice-line"
               iconBgColor="bg-secondary-100"
               iconColor="text-secondary-600"
             />
           </>
         )}
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
                  onDelete={handleDeleteResume}
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
