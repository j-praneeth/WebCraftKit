import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobCard } from "@/components/dashboard/job-card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Resume, JobPosting } from "@shared/schema";
import { calculateJobMatchScore } from "@/lib/openai";

function JobMatching() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

  // Fetch jobs
  const { 
    data: jobs,
    isLoading: isLoadingJobs 
  } = useQuery<JobPosting[]>({
    queryKey: ["/api/jobs"],
  });

  // Fetch resumes
  const { 
    data: resumes,
    isLoading: isLoadingResumes 
  } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });

  const filteredJobs = jobs?.filter(job => {
    if (!searchTerm && !jobLocation) return true;
    
    const titleMatch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const locationMatch = !jobLocation || 
                          (job.location && job.location.toLowerCase().includes(jobLocation.toLowerCase()));
    
    return titleMatch && locationMatch;
  });

  const handleResumeSelect = (resumeId: number) => {
    setSelectedResumeId(resumeId);
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

  const handleAnalyzeJobMatch = async () => {
    if (!selectedResumeId) {
      toast({
        title: "Error",
        description: "Please select a resume to analyze job match",
        variant: "destructive"
      });
      return;
    }

    if (!jobDescription) {
      toast({
        title: "Error",
        description: "Please enter a job description",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      const selectedResume = resumes?.find(r => r.id === selectedResumeId);
      
      if (!selectedResume) {
        throw new Error("Selected resume not found");
      }

      const matchResult = await calculateJobMatchScore(
        selectedResume.content,
        jobDescription
      );

      toast({
        title: "Job Match Analysis",
        description: `Your resume has a ${matchResult.score}% match with this job. ${matchResult.missingKeywords.length > 0 ? `Consider adding keywords: ${matchResult.missingKeywords.slice(0, 3).join(', ')}` : ''}`,
      });

    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze job match",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Job Matching
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Find the perfect job opportunities that match your skills and experience
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Job Title or Company</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search jobs..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location</label>
              <Input
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                placeholder="City, state, or remote"
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <i className="ri-search-line mr-1"></i> Search Jobs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Match Analyzer */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Job Match Analyzer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Your Resume</label>
                {isLoadingResumes ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : resumes && resumes.length > 0 ? (
                  <div className="space-y-2">
                    {resumes.map(resume => (
                      <div 
                        key={resume.id}
                        className={`p-3 border rounded-md cursor-pointer ${selectedResumeId === resume.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => handleResumeSelect(resume.id)}
                      >
                        <div className="font-medium">{resume.title}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No resumes found</p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => window.location.href = '/resume-builder/new'}
                    >
                      Create Resume
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Paste Job Description</label>
                <textarea 
                  rows={6} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Paste a job description to analyze your match score..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
              </div>
              
              <Button 
                onClick={handleAnalyzeJobMatch} 
                disabled={isAnalyzing || !selectedResumeId || !jobDescription}
                className="w-full md:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="ri-search-eye-line mr-2"></i> Analyze Match Score
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Listings */}
      <div>
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Job Opportunities</h2>
        {isLoadingJobs ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : filteredJobs && filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
              <JobCard 
                key={job.id}
                job={job}
                onSave={handleSaveJob}
                onApply={handleApplyJob}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <i className="ri-search-line text-gray-500 text-xl"></i>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Job Search Tips */}
      <div className="mt-10">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Job Search Tips</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Optimize Your Application</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li>Tailor your resume for each job application</li>
                  <li>Include keywords from the job description</li>
                  <li>Quantify your achievements with metrics</li>
                  <li>Follow application instructions carefully</li>
                  <li>Apply early - many companies review applications on a rolling basis</li>
                </ul>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Networking Strategies</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li>Connect with employees at target companies</li>
                  <li>Attend industry events and webinars</li>
                  <li>Join relevant professional groups on LinkedIn</li>
                  <li>Follow up after submitting applications</li>
                  <li>Request informational interviews to learn about companies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default JobMatching;
