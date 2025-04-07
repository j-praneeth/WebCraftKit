import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ResumeCard, NewResumeCard } from "@/components/dashboard/resume-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Resume } from "@shared/schema";
import { useLocation } from "wouter";

function ResumeBuilder() {
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

  return (
    <DashboardLayout>
      <div className="mb-8 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Resume Builder
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and optimize your resume for ATS systems
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Button onClick={handleCreateNewResume} className="ml-3 flex items-center">
            <i className="ri-add-line mr-1"></i> New Resume
          </Button>
        </div>
      </div>

      {/* Resume List */}
      <div className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingResumes ? (
            <div className="col-span-3 flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
            </div>
          ) : resumes && resumes.length > 0 ? (
            <>
              {resumes.map(resume => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onEdit={handleEditResume}
                  onDownload={handleDownloadResume}
                />
              ))}
              <NewResumeCard onClick={handleCreateNewResume} />
            </>
          ) : (
            <div className="col-span-3 bg-white shadow rounded-lg overflow-hidden">
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                  <i className="ri-file-list-line text-primary-600 text-xl"></i>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No resumes yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first resume</p>
                <div className="mt-6">
                  <Button onClick={handleCreateNewResume}>
                    Create New Resume
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-10">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Resume Writing Tips</h2>
        <div className="mt-4 bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">ATS Optimization Tips</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li>Use keywords from the job description</li>
                  <li>Keep formatting simple and avoid tables</li>
                  <li>Include section headers like "Experience" and "Education"</li>
                  <li>Save your resume as a PDF or .docx file</li>
                  <li>Quantify your achievements with metrics</li>
                </ul>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Content Best Practices</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li>Tailor your resume for each job application</li>
                  <li>Use action verbs to describe accomplishments</li>
                  <li>Include relevant skills and certifications</li>
                  <li>Keep your resume to 1-2 pages</li>
                  <li>Proofread for grammar and spelling errors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ResumeBuilder;
