import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Resume, ResumeTemplate } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { optimizeResume } from "@/lib/openai";
import { templates, getTemplatesByPlan } from "@/lib/templates/index";
import { TemplateRenderer } from "@/components/resume/template-renderer";
import { createRoot } from "react-dom/client";

interface ResumeContent {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    summary?: string;
  };
  experience?: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: string[];
  certifications?: Array<{
    name: string;
    issuer?: string;
    date?: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    url?: string;
    technologies?: string[];
  }>;
}

interface ResumeData {
  title: string;
  content: ResumeContent;
  jobDescription?: string;
  templateId?: string;
}

function ResumeEditor() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [resumeData, setResumeData] = useState<{
    title: string;
    content: {
      personalInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        location?: string;
        website?: string;
        summary?: string;
      };
      experience?: Array<{
        company: string;
        position: string;
        location?: string;
        startDate: string;
        endDate?: string;
        description: string;
      }>;
      education?: Array<{
        institution: string;
        degree: string;
        field?: string;
        location?: string;
        startDate: string;
        endDate?: string;
        description?: string;
      }>;
      skills?: string[];
      certifications?: Array<{
        name: string;
        issuer?: string;
        date?: string;
        description?: string;
      }>;
      projects?: Array<{
        name: string;
        description: string;
        url?: string;
        technologies?: string[];
      }>;
    };
    jobDescription?: string;
    templateId?: string;
  }>({
    title: "",
    content: {
      personalInfo: {
        name: "",
        email: "",
        phone: "",
        location: "",
        website: "",
        summary: "",
      },
      experience: [
        {
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
      education: [
        {
          institution: "",
          degree: "",
          field: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        },
      ],
      skills: [""],
      certifications: [
        {
          name: "",
          issuer: "",
          date: "",
          description: "",
        },
      ],
      projects: [
        {
          name: "",
          description: "",
          url: "",
          technologies: [""],
        },
      ],
    },
    jobDescription: "",
    templateId: "modern",
  });
  
  const [activeTab, setActiveTab] = useState("personal");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationTips, setOptimizationTips] = useState<string[]>([]);

  // Fetch resume data
  const { 
    data: resume,
    isLoading: isLoadingResume,
    isError: isResumeError,
  } = useQuery<Resume>({
    queryKey: [`/api/resumes/${id}`],
    enabled: !!user && !!id && id !== "new",
  });

  // Get template data from local templates
  const template = resume?.templateId ? templates[resume.templateId as keyof typeof templates] || templates.modern : templates.modern;

  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async (data?: { templateId?: string }) => {
      let updatedData;
      
      if (data?.templateId) {
        // If only updating template
        updatedData = {
          ...resume,
          templateId: data.templateId
        };
      } else {
        // If updating content
        const content = {
          personalInfo: resumeData.content.personalInfo || {},
          experience: resumeData.content.experience || [],
          education: resumeData.content.education || [],
          skills: resumeData.content.skills || [],
          certifications: resumeData.content.certifications || [],
          projects: resumeData.content.projects || []
        };

        updatedData = {
          title: resumeData.title,
          content,
          templateId: resume?.templateId,
          atsScore: resume?.atsScore,
          isOptimized: resume?.isOptimized
        };
      }

      const response = await apiRequest(
        "PATCH",
        `/api/resumes/${id}`,
        updatedData
      );

      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/resumes/${id}`] });
      await queryClient.cancelQueries({ queryKey: ["/api/resumes"] });

      // Snapshot the previous value
      const previousResume = queryClient.getQueryData([`/api/resumes/${id}`]);

      // Optimistically update the cache
      const optimisticResume = {
        ...resume,
        title: resumeData.title,
        content: resumeData.content,
      };

      queryClient.setQueryData([`/api/resumes/${id}`], optimisticResume);
      queryClient.setQueryData(["/api/resumes"], (old: any[]) => {
        return old?.map(r => r.id === id ? optimisticResume : r) ?? [];
      });

      return { previousResume };
    },
    onSuccess: async (updatedResume) => {
      // Update cache with the actual server response
      queryClient.setQueryData([`/api/resumes/${id}`], updatedResume);
      queryClient.setQueryData(["/api/resumes"], (old: any[]) => {
        return old?.map(r => r.id === id ? updatedResume : r) ?? [];
      });

      toast({
        title: "Resume saved",
        description: "Your resume has been saved successfully.",
      });
    },
    onError: (error: any, _, context: any) => {
      // Rollback on error
      if (context?.previousResume) {
        queryClient.setQueryData([`/api/resumes/${id}`], context.previousResume);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to save resume. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      // Always refetch after error or success to ensure cache is in sync
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/resumes/${id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] }),
      ]);
      // Force an immediate refetch
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/resumes/${id}`] }),
        queryClient.refetchQueries({ queryKey: ["/api/resumes"] }),
      ]);
    },
  });
  
  // ATS optimization mutation
  const optimizeResumeMutation = useMutation({
    mutationFn: async () => {
      setIsOptimizing(true);
      if (!resumeData.jobDescription) {
        throw new Error("Please enter a job description to optimize against");
      }
      
      try {
        // First get the optimization result
        const optimizationResult = await optimizeResume(resumeData.content, resumeData.jobDescription);
        
        // Then update the resume with the optimized content
        const response = await apiRequest(
          "PATCH",
          `/api/resumes/${id}`,
          {
            title: resumeData.title,
            content: optimizationResult.optimizedContent || resumeData.content,
            atsScore: optimizationResult.score,
            isOptimized: true,
          }
        );
        
        const updatedResume = await response.json();
        return { ...optimizationResult, updatedResume };
      } catch (error) {
        console.error("Error optimizing resume:", error);
        throw new Error("Failed to optimize resume. Please try again.");
      } finally {
        setIsOptimizing(false);
      }
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [`/api/resumes/${id}`] });
      await queryClient.cancelQueries({ queryKey: ["/api/resumes"] });

      // Snapshot the previous values
      const previousResume = queryClient.getQueryData([`/api/resumes/${id}`]);
      const previousTips = optimizationTips;

      return { previousResume, previousTips };
    },
    onSuccess: (data) => {
      // Update cache with the actual server response
      queryClient.setQueryData([`/api/resumes/${id}`], data.updatedResume);
      queryClient.setQueryData(["/api/resumes"], (old: any[]) => {
        return old?.map(r => r.id === id ? data.updatedResume : r) ?? [];
      });

      // Update local state
      setResumeData(prev => ({
        ...prev,
        content: data.optimizedContent || prev.content,
      }));
      
      // Set optimization tips
      setOptimizationTips(data.tips || []);
      
      toast({
        title: "Resume optimized",
        description: `Your resume has been optimized with an ATS score of ${typeof data.atsScore === 'number' ? data.atsScore : (typeof data.score === 'number' ? data.score : 0)}%.`,
      });
    },
    onError: (error: any, _, context: any) => {
      // Rollback on error
      if (context?.previousResume) {
        queryClient.setQueryData([`/api/resumes/${id}`], context.previousResume);
      }
      setOptimizationTips(context?.previousTips || []);
      
      toast({
        title: "Optimization error",
        description: error.message || "Failed to optimize resume. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      // Always refetch after error or success to ensure cache is in sync
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/resumes/${id}`] }),
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] }),
      ]);
      // Force an immediate refetch
      await Promise.all([
        queryClient.refetchQueries({ queryKey: [`/api/resumes/${id}`] }),
        queryClient.refetchQueries({ queryKey: ["/api/resumes"] }),
      ]);
    }
  });

  // Initialize resume data from API
  useEffect(() => {
    if (resume && !isLoadingResume) {
      const content = resume.content as ResumeContent;
      setResumeData({
        title: resume.title,
        content: {
          personalInfo: content?.personalInfo || {
            name: "", email: "", phone: "", location: "", website: "", summary: ""
          },
          experience: content?.experience || [{
            company: "", position: "", location: "", startDate: "", endDate: "", description: ""
          }],
          education: content?.education || [{
            institution: "", degree: "", field: "", location: "", startDate: "", endDate: ""
          }],
          skills: content?.skills || [""],
          certifications: content?.certifications || [{
            name: "", issuer: "", date: "", description: ""
          }],
          projects: content?.projects || [{
            name: "", description: "", url: "", technologies: [""]
          }]
        },
        jobDescription: "",
        templateId: resume.templateId || undefined,
      });
    }
  }, [resume, isLoadingResume]);

  // Handle saving the resume
  const handleSaveResume = () => {
    updateResumeMutation.mutate({});
  };

  // Handle optimizing the resume
  const handleOptimizeResume = () => {
    optimizeResumeMutation.mutate();
  };

  // Add new item to a list in the resume content
  const handleAddItem = (section: string) => {
    setResumeData((prev) => {
      const newContent = { ...prev.content };
      
      if (section === "experience") {
        newContent.experience = [
          ...(newContent.experience || []),
          { company: "", position: "", location: "", startDate: "", endDate: "", description: "" },
        ];
      } else if (section === "education") {
        newContent.education = [
          ...(newContent.education || []),
          { institution: "", degree: "", field: "", location: "", startDate: "", endDate: "" },
        ];
      } else if (section === "skills") {
        newContent.skills = [...(newContent.skills || []), ""];
      } else if (section === "certifications") {
        newContent.certifications = [
          ...(newContent.certifications || []),
          { name: "", issuer: "", date: "", description: "" },
        ];
      } else if (section === "projects") {
        newContent.projects = [
          ...(newContent.projects || []),
          { name: "", description: "", url: "", technologies: [""] },
        ];
      }
      
      return {
        ...prev,
        content: newContent,
      };
    });
  };

  // Remove an item from a list in the resume content
  const handleRemoveItem = (section: string, index: number) => {
    setResumeData((prev) => {
      const newContent = { ...prev.content };
      
      if (section === "experience" && newContent.experience) {
        newContent.experience = newContent.experience.filter((_, i) => i !== index);
      } else if (section === "education" && newContent.education) {
        newContent.education = newContent.education.filter((_, i) => i !== index);
      } else if (section === "skills" && newContent.skills) {
        newContent.skills = newContent.skills.filter((_, i) => i !== index);
      } else if (section === "certifications" && newContent.certifications) {
        newContent.certifications = newContent.certifications.filter((_, i) => i !== index);
      } else if (section === "projects" && newContent.projects) {
        newContent.projects = newContent.projects.filter((_, i) => i !== index);
      }
      
      return {
        ...prev,
        content: newContent,
      };
    });
  };

  // Loading state
  if (isLoadingResume) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (isResumeError) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load resume. Please try again or create a new resume.
            </AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => navigate("/resume-builder")}>
            Back to Resumes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {resumeData.title || "Untitled Resume"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {template ? `Template: ${template.name}` : "Resume editor"}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate("/resume-builder")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveResume}
            disabled={updateResumeMutation.isPending}
          >
            {updateResumeMutation.isPending ? "Saving..." : "Save Resume"}
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const { generatePDF } = await import('@/lib/pdf-generator');
                
                // Create a temporary div for PDF generation
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.width = '794px'; // A4 width
                tempDiv.style.height = '1123px'; // A4 height
                document.body.appendChild(tempDiv);
                
                // Create a new root and render the template
                const root = createRoot(tempDiv);
                
                // Wait for the render to complete
                await new Promise<void>((resolve) => {
                  root.render(
                    <TemplateRenderer
                      template={templates[resumeData.templateId as keyof typeof templates] || templates.modern}
                      resume={resumeData as Resume}
                      isPrintMode={true}
                    />
                  );
                  // Give it a moment to render
                  setTimeout(resolve, 500);
                });

                // Add a class to ensure proper print styling
                tempDiv.classList.add('print-mode');
                
                // Generate PDF
                await generatePDF(tempDiv, `${resumeData.title || 'resume'}.pdf`);
                
                // Cleanup after a short delay to ensure PDF generation is complete
                setTimeout(() => {
                  root.unmount();
                  if (document.body.contains(tempDiv)) {
                    document.body.removeChild(tempDiv);
                  }
                }, 1000);
                
              } catch (error) {
                console.error('PDF Generation Error:', error);
                toast({
                  title: "Error",
                  description: "Failed to generate PDF. Please try again.",
                  variant: "destructive",
                });
              }
            }}
            disabled={!id || id === "new"}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Template Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getTemplatesByPlan((user?.plan as 'free' | 'professional' | 'enterprise') || 'free').map((template) => (
                <div
                  key={template.id}
                  onClick={() => {
                    // Update the template ID in resumeData
                    setResumeData(prev => ({
                      ...prev,
                      templateId: template.id as string
                    }));
                    
                    // Save the change immediately
                    updateResumeMutation.mutate({
                      templateId: template.id
                    });
                    
                    toast({
                      title: "Template Updated",
                      description: `Switched to ${template.name} template`,
                    });
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all h-64 ${
                    resumeData.templateId === template.id
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <img
                    src={template.previewImage}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h4 className="text-white font-medium">{template.name}</h4>
                    <p className="text-white/80 text-sm">{template.description}</p>
                  </div>
                  {template.category !== 'free' && user?.plan === 'free' && (
                    <div className="absolute top-2 right-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                      Premium
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Editor Column and Optimizer Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  value={resumeData.title}
                  onChange={(e) => setResumeData({ ...resumeData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid grid-cols-3 md:grid-cols-6">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={resumeData.content.personalInfo?.name || ""}
                          onChange={(e) => 
                            setResumeData({
                              ...resumeData,
                              content: {
                                ...resumeData.content,
                                personalInfo: {
                                  ...(resumeData.content.personalInfo || {}),
                                  name: e.target.value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={resumeData.content.personalInfo?.email || ""}
                          onChange={(e) => 
                            setResumeData({
                              ...resumeData,
                              content: {
                                ...resumeData.content,
                                personalInfo: {
                                  ...(resumeData.content.personalInfo || {}),
                                  email: e.target.value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={resumeData.content.personalInfo?.phone || ""}
                          onChange={(e) => 
                            setResumeData({
                              ...resumeData,
                              content: {
                                ...resumeData.content,
                                personalInfo: {
                                  ...(resumeData.content.personalInfo || {}),
                                  phone: e.target.value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="City, State/Province, Country"
                          value={resumeData.content.personalInfo?.location || ""}
                          onChange={(e) => 
                            setResumeData({
                              ...resumeData,
                              content: {
                                ...resumeData.content,
                                personalInfo: {
                                  ...(resumeData.content.personalInfo || {}),
                                  location: e.target.value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="website">Website/LinkedIn</Label>
                        <Input
                          id="website"
                          placeholder="https://"
                          value={resumeData.content.personalInfo?.website || ""}
                          onChange={(e) => 
                            setResumeData({
                              ...resumeData,
                              content: {
                                ...resumeData.content,
                                personalInfo: {
                                  ...(resumeData.content.personalInfo || {}),
                                  website: e.target.value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="summary">Professional Summary</Label>
                        <Textarea
                          id="summary"
                          rows={5}
                          value={resumeData.content.personalInfo?.summary || ""}
                          onChange={(e) => 
                            setResumeData({
                              ...resumeData,
                              content: {
                                ...resumeData.content,
                                personalInfo: {
                                  ...(resumeData.content.personalInfo || {}),
                                  summary: e.target.value,
                                },
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="mt-4">
                  <div className="space-y-6">
                    {resumeData.content.experience?.map((exp, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Experience #{index + 1}</h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem("experience", index)}
                            disabled={resumeData.content.experience?.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`company-${index}`}>Company</Label>
                            <Input
                              id={`company-${index}`}
                              value={exp.company}
                              onChange={(e) => {
                                const newExperience = [...resumeData.content.experience!];
                                newExperience[index] = { ...exp, company: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, experience: newExperience },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`position-${index}`}>Position/Title</Label>
                            <Input
                              id={`position-${index}`}
                              value={exp.position}
                              onChange={(e) => {
                                const newExperience = [...resumeData.content.experience!];
                                newExperience[index] = { ...exp, position: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, experience: newExperience },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`loc-${index}`}>Location</Label>
                            <Input
                              id={`loc-${index}`}
                              value={exp.location || ""}
                              onChange={(e) => {
                                const newExperience = [...resumeData.content.experience!];
                                newExperience[index] = { ...exp, location: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, experience: newExperience },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`start-${index}`}>Start Date</Label>
                              <Input
                                id={`start-${index}`}
                                value={exp.startDate || ""}
                                placeholder="MM/YYYY"
                                onChange={(e) => {
                                  const newExperience = [...resumeData.content.experience!];
                                  newExperience[index] = { ...exp, startDate: e.target.value };
                                  setResumeData({
                                    ...resumeData,
                                    content: { ...resumeData.content, experience: newExperience },
                                  });
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`end-${index}`}>End Date</Label>
                              <Input
                                id={`end-${index}`}
                                value={exp.endDate || ""}
                                placeholder="MM/YYYY or Present"
                                onChange={(e) => {
                                  const newExperience = [...resumeData.content.experience!];
                                  newExperience[index] = { ...exp, endDate: e.target.value };
                                  setResumeData({
                                    ...resumeData,
                                    content: { ...resumeData.content, experience: newExperience },
                                  });
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`desc-${index}`}>Description</Label>
                            <Textarea
                              id={`desc-${index}`}
                              rows={4}
                              value={exp.description || ""}
                              onChange={(e) => {
                                const newExperience = [...resumeData.content.experience!];
                                newExperience[index] = { ...exp, description: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, experience: newExperience },
                                });
                              }}
                              className="mt-1"
                              placeholder="Describe your responsibilities and achievements. Use bullet points starting with action verbs for better ATS readability."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => handleAddItem("experience")} 
                      variant="outline" 
                      className="w-full"
                    >
                      Add Experience
                    </Button>
                  </div>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="mt-4">
                  <div className="space-y-6">
                    {resumeData.content.education?.map((edu, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Education #{index + 1}</h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem("education", index)}
                            disabled={resumeData.content.education?.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`institution-${index}`}>Institution</Label>
                            <Input
                              id={`institution-${index}`}
                              value={edu.institution}
                              onChange={(e) => {
                                const newEducation = [...resumeData.content.education!];
                                newEducation[index] = { ...edu, institution: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, education: newEducation },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`degree-${index}`}>Degree</Label>
                            <Input
                              id={`degree-${index}`}
                              value={edu.degree}
                              onChange={(e) => {
                                const newEducation = [...resumeData.content.education!];
                                newEducation[index] = { ...edu, degree: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, education: newEducation },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`field-${index}`}>Field of Study</Label>
                            <Input
                              id={`field-${index}`}
                              value={edu.field || ""}
                              onChange={(e) => {
                                const newEducation = [...resumeData.content.education!];
                                newEducation[index] = { ...edu, field: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, education: newEducation },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`loc-edu-${index}`}>Location</Label>
                            <Input
                              id={`loc-edu-${index}`}
                              value={edu.location || ""}
                              onChange={(e) => {
                                const newEducation = [...resumeData.content.education!];
                                newEducation[index] = { ...edu, location: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, education: newEducation },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`edu-start-${index}`}>Start Date</Label>
                              <Input
                                id={`edu-start-${index}`}
                                value={edu.startDate || ""}
                                placeholder="MM/YYYY"
                                onChange={(e) => {
                                  const newEducation = [...resumeData.content.education!];
                                  newEducation[index] = { ...edu, startDate: e.target.value };
                                  setResumeData({
                                    ...resumeData,
                                    content: { ...resumeData.content, education: newEducation },
                                  });
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edu-end-${index}`}>End Date</Label>
                              <Input
                                id={`edu-end-${index}`}
                                value={edu.endDate || ""}
                                placeholder="MM/YYYY or Present"
                                onChange={(e) => {
                                  const newEducation = [...resumeData.content.education!];
                                  newEducation[index] = { ...edu, endDate: e.target.value };
                                  setResumeData({
                                    ...resumeData,
                                    content: { ...resumeData.content, education: newEducation },
                                  });
                                }}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`edu-desc-${index}`}>Description</Label>
                            <Textarea
                              id={`edu-desc-${index}`}
                              rows={4}
                              value={edu.description || ""}
                              onChange={(e) => {
                                const newEducation = [...resumeData.content.education!];
                                newEducation[index] = { ...edu, description: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, education: newEducation },
                                });
                              }}
                              className="mt-1"
                              placeholder="List relevant coursework, honors, GPA (if above 3.5), etc."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => handleAddItem("education")} 
                      variant="outline" 
                      className="w-full"
                    >
                      Add Education
                    </Button>
                  </div>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Add your skills, separated by category if needed. Include both technical and soft skills relevant to the job.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {resumeData.content.skills?.map((skill, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={skill}
                            onChange={(e) => {
                              const newSkills = [...resumeData.content.skills!];
                              newSkills[index] = e.target.value;
                              setResumeData({
                                ...resumeData,
                                content: { ...resumeData.content, skills: newSkills },
                              });
                            }}
                            placeholder="Skill or technology"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem("skills", index)}
                            disabled={resumeData.content.skills?.length === 1}
                          >
                            <i className="ri-delete-bin-line"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button 
                      onClick={() => handleAddItem("skills")} 
                      variant="outline" 
                      className="w-full"
                    >
                      Add Skill
                    </Button>
                  </div>
                </TabsContent>

                {/* Certifications Tab */}
                <TabsContent value="certifications" className="mt-4">
                  <div className="space-y-6">
                    {resumeData.content.certifications?.map((cert, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Certification #{index + 1}</h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem("certifications", index)}
                            disabled={resumeData.content.certifications?.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`cert-name-${index}`}>Certification Name</Label>
                            <Input
                              id={`cert-name-${index}`}
                              value={cert.name}
                              onChange={(e) => {
                                const newCerts = [...resumeData.content.certifications!];
                                newCerts[index] = { ...cert, name: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, certifications: newCerts },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`cert-issuer-${index}`}>Issuing Organization</Label>
                            <Input
                              id={`cert-issuer-${index}`}
                              value={cert.issuer || ""}
                              onChange={(e) => {
                                const newCerts = [...resumeData.content.certifications!];
                                newCerts[index] = { ...cert, issuer: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, certifications: newCerts },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`cert-date-${index}`}>Date</Label>
                            <Input
                              id={`cert-date-${index}`}
                              value={cert.date || ""}
                              placeholder="MM/YYYY"
                              onChange={(e) => {
                                const newCerts = [...resumeData.content.certifications!];
                                newCerts[index] = { ...cert, date: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, certifications: newCerts },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => handleAddItem("certifications")} 
                      variant="outline" 
                      className="w-full"
                    >
                      Add Certification
                    </Button>
                  </div>
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="mt-4">
                  <div className="space-y-6">
                    {resumeData.content.projects?.map((project, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Project #{index + 1}</h3>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem("projects", index)}
                            disabled={resumeData.content.projects?.length === 1}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`project-name-${index}`}>Project Name</Label>
                            <Input
                              id={`project-name-${index}`}
                              value={project.name}
                              onChange={(e) => {
                                const newProjects = [...resumeData.content.projects!];
                                newProjects[index] = { ...project, name: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, projects: newProjects },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`project-url-${index}`}>URL/Link</Label>
                            <Input
                              id={`project-url-${index}`}
                              value={project.url || ""}
                              onChange={(e) => {
                                const newProjects = [...resumeData.content.projects!];
                                newProjects[index] = { ...project, url: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, projects: newProjects },
                                });
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor={`project-desc-${index}`}>Description</Label>
                            <Textarea
                              id={`project-desc-${index}`}
                              rows={4}
                              value={project.description || ""}
                              onChange={(e) => {
                                const newProjects = [...resumeData.content.projects!];
                                newProjects[index] = { ...project, description: e.target.value };
                                setResumeData({
                                  ...resumeData,
                                  content: { ...resumeData.content, projects: newProjects },
                                });
                              }}
                              className="mt-1"
                              placeholder="Describe the project, your role, technologies used, and outcomes."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => handleAddItem("projects")} 
                      variant="outline" 
                      className="w-full"
                    >
                      Add Project
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Optimization Column */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">ATS Optimization</h3>
              
              <div className="mb-4">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  rows={8}
                  value={resumeData.jobDescription || ""}
                  onChange={(e) => setResumeData({ ...resumeData, jobDescription: e.target.value })}
                  className="mt-1"
                  placeholder="Paste the job description here to optimize your resume for ATS..."
                />
              </div>
              
              <Button 
                onClick={handleOptimizeResume} 
                className="w-full" 
                disabled={isOptimizing || !resumeData.jobDescription}
              >
                {isOptimizing ? "Optimizing..." : "Optimize for ATS"}
              </Button>

              {optimizationTips.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Optimization Tips</h4>
                  <div className="bg-primary-50 p-4 rounded-md">
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {optimizationTips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}


            </CardContent>
          </Card>
                    </div>
                  </div>

      {/* Resume Preview */}
      <div id="resume-preview" className="mb-6 mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="print:hidden">
              <h3 className="text-lg font-medium mb-4">Resume Preview</h3>
            </div>
            <div className="border rounded-lg overflow-hidden print:border-0">
              <div className="relative">
                {isLoadingResume ? (
                  <div className="flex justify-center items-center h-[600px] bg-gray-50 rounded">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
                  </div>
                ) : resumeData ? (
                  <div key={`template-${resumeData.templateId || 'modern'}-${Date.now()}`}>
                    <TemplateRenderer
                      template={templates[resumeData.templateId as keyof typeof templates] || templates.modern}
                      resume={resumeData as Resume}
                      isPrintMode={false}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-[600px] bg-gray-50 rounded">
                    <p className="text-gray-500">No resume data available</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        
    </DashboardLayout>
  );
}

export default ResumeEditor;