import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CoverLetter, Resume } from "@shared/schema";
import { generateCoverLetter } from "@/lib/openai";

function CoverLetterGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    jobDescription: "",
    letterContent: "",
  });

  // Fetch cover letters
  const { 
    data: coverLetters,
    isLoading: isLoadingCoverLetters
  } = useQuery<CoverLetter[]>({
    queryKey: ["/api/cover-letters"],
    enabled: !!user,
  });

  // Fetch resumes
  const { 
    data: resumes,
    isLoading: isLoadingResumes
  } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    enabled: !!user,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResumeSelect = (resumeId: number) => {
    setSelectedResumeId(resumeId);
  };

  const handleGenerateCoverLetter = async () => {
    if (!selectedResumeId) {
      toast({
        title: "Error",
        description: "Please select a resume to continue",
        variant: "destructive"
      });
      return;
    }

    if (!formData.jobTitle || !formData.company || !formData.jobDescription) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      const selectedResume = resumes?.find(r => r.id === selectedResumeId);
      
      if (!selectedResume) {
        throw new Error("Selected resume not found");
      }

      const generatedContent = await generateCoverLetter(
        selectedResume.content,
        formData.jobDescription,
        formData.company
      );

      setFormData(prev => ({ ...prev, letterContent: generatedContent }));

      toast({
        title: "Cover letter generated",
        description: "Your cover letter has been created successfully"
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate cover letter",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!formData.letterContent) {
      toast({
        title: "Error",
        description: "Please generate a cover letter first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/cover-letters", {
        title: `Cover Letter for ${formData.jobTitle} at ${formData.company}`,
        content: formData.letterContent,
        jobTitle: formData.jobTitle,
        company: formData.company
      });

      if (response.ok) {
        toast({
          title: "Cover letter saved",
          description: "Your cover letter has been saved successfully"
        });

        // Reset form
        setFormData({
          jobTitle: "",
          company: "",
          jobDescription: "",
          letterContent: ""
        });
        setSelectedResumeId(null);
      } else {
        throw new Error("Failed to save cover letter");
      }
    } catch (error) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save cover letter",
        variant: "destructive"
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Cover Letter Generator
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Create personalized cover letters based on your resume and job description
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Select Resume */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Step 1: Select Resume</CardTitle>
            <CardDescription>Choose a resume as the basis for your cover letter</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingResumes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : resumes && resumes.length > 0 ? (
              <div className="space-y-3">
                {resumes.map(resume => (
                  <div 
                    key={resume.id}
                    className={`p-3 border rounded-md cursor-pointer ${selectedResumeId === resume.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}
                    onClick={() => handleResumeSelect(resume.id)}
                  >
                    <div className="font-medium">{resume.title}</div>
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(resume.lastUpdated).toLocaleDateString()}
                    </div>
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
          </CardContent>
        </Card>

        {/* Step 2: Job Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Step 2: Enter Job Details</CardTitle>
            <CardDescription>Provide information about the job you're applying for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Developer"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="e.g. Tech Solutions Inc."
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea
                  id="jobDescription"
                  name="jobDescription"
                  value={formData.jobDescription}
                  onChange={handleInputChange}
                  placeholder="Paste the job description here..."
                  rows={6}
                  required
                />
              </div>
              <Button 
                onClick={handleGenerateCoverLetter} 
                disabled={isGenerating || !selectedResumeId}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : "Generate Cover Letter"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Generated Cover Letter */}
        {formData.letterContent && (
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Step 3: Review and Save</CardTitle>
              <CardDescription>Edit the generated cover letter if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  id="letterContent"
                  name="letterContent"
                  value={formData.letterContent}
                  onChange={handleInputChange}
                  rows={12}
                  className="font-serif"
                />
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => window.print()}>Print</Button>
                  <Button onClick={handleSaveCoverLetter}>Save Cover Letter</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Cover Letters */}
      {coverLetters && coverLetters.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Saved Cover Letters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverLetters.map(letter => (
              <Card key={letter.id}>
                <CardContent className="pt-6">
                  <h3 className="font-medium text-gray-900">{letter.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created: {new Date(letter.lastUpdated).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button size="sm">Download</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default CoverLetterGenerator;
