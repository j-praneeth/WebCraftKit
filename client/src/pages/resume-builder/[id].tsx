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

interface ResumeSection {
  id: string;
  title: string;
  content: any;
  type: "text" | "list" | "contact" | "skills" | "education" | "experience";
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
        current?: boolean;
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
      skills?: Array<string>;
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
      awards?: Array<{
        title: string;
        issuer?: string;
        date?: string;
        description?: string;
      }>;
      languages?: Array<{
        language: string;
        proficiency: string;
      }>;
    };
    jobDescription?: string;
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
          current: false,
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

  // Fetch template data if we have a templateId
  const {
    data: template,
    isLoading: isLoadingTemplate,
  } = useQuery<ResumeTemplate>({
    queryKey: [`/api/resume-templates/${resume?.templateId}`],
    enabled: !!resume?.templateId,
  });

  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(
        "PATCH",
        `/api/resumes/${id}`,
        {
          title: resumeData.title,
          content: resumeData.content,
        }
      );
    },
    onSuccess: () => {
      toast({
        title: "Resume saved",
        description: "Your resume has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/resumes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save resume. Please try again.",
        variant: "destructive",
      });
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
        const result = await optimizeResume(resumeData.content, resumeData.jobDescription);
        return result;
      } catch (error) {
        console.error("Error optimizing resume:", error);
        throw new Error("Failed to optimize resume. Please try again.");
      } finally {
        setIsOptimizing(false);
      }
    },
    onSuccess: (data) => {
      // Update the resume with optimized content
      setResumeData(prev => ({
        ...prev,
        content: data.optimizedContent || prev.content,
      }));
      
      // Set optimization tips
      setOptimizationTips(data.tips || []);
      
      // Save the changes to the server with updated ATS score
      apiRequest(
        "PATCH",
        `/api/resumes/${id}`,
        {
          title: resumeData.title,
          content: data.optimizedContent || resumeData.content,
          atsScore: data.score,
          isOptimized: true,
        }
      ).then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/resumes/${id}`] });
        queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      });
      
      toast({
        title: "Resume optimized",
        description: `Your resume has been optimized with an ATS score of ${data.score}%.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Optimization error",
        description: error.message || "Failed to optimize resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize resume data from API
  useEffect(() => {
    if (resume && !isLoadingResume) {
      setResumeData({
        title: resume.title,
        content: resume.content || {
          personalInfo: { name: "", email: "", phone: "", location: "", website: "", summary: "" },
          experience: [{ company: "", position: "", location: "", startDate: "", endDate: "", description: "" }],
          education: [{ institution: "", degree: "", field: "", location: "", startDate: "", endDate: "" }],
          skills: [""],
        },
        jobDescription: "",
      });
    }
  }, [resume, isLoadingResume]);

  // Handle saving the resume
  const handleSaveResume = () => {
    updateResumeMutation.mutate();
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Column */}
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

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Resume Preview</h3>
                <p className="text-sm text-gray-500">
                  A simplified preview of your resume content. The final layout will depend on the template you selected.
                </p>

                <div className="bg-gray-50 p-4 rounded-md max-h-[500px] overflow-y-auto">
                  {/* Personal Info */}
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">
                      {resumeData.content.personalInfo?.name || "Your Name"}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-2 text-sm">
                      {resumeData.content.personalInfo?.email && (
                        <span>{resumeData.content.personalInfo.email}</span>
                      )}
                      {resumeData.content.personalInfo?.phone && (
                        <span>• {resumeData.content.personalInfo.phone}</span>
                      )}
                      {resumeData.content.personalInfo?.location && (
                        <span>• {resumeData.content.personalInfo.location}</span>
                      )}
                    </div>
                    {resumeData.content.personalInfo?.website && (
                      <div className="text-sm mt-1">
                        <span>{resumeData.content.personalInfo.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {resumeData.content.personalInfo?.summary && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold border-b mb-2">Professional Summary</h3>
                      <p className="text-sm">{resumeData.content.personalInfo.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {resumeData.content.experience && resumeData.content.experience.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold border-b mb-2">Experience</h3>
                      {resumeData.content.experience.map((exp, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{exp.position}</span>
                            <span className="text-sm">
                              {exp.startDate} - {exp.endDate || "Present"}
                            </span>
                          </div>
                          <div className="text-sm">{exp.company}{exp.location ? `, ${exp.location}` : ''}</div>
                          <p className="text-sm mt-1">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {resumeData.content.education && resumeData.content.education.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold border-b mb-2">Education</h3>
                      {resumeData.content.education.map((edu, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{edu.institution}</span>
                            <span className="text-sm">
                              {edu.startDate} - {edu.endDate || "Present"}
                            </span>
                          </div>
                          <div className="text-sm">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                            {edu.location ? `, ${edu.location}` : ''}
                          </div>
                          {edu.description && (
                            <p className="text-sm mt-1">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {resumeData.content.skills && resumeData.content.skills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold border-b mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.content.skills.filter(Boolean).map((skill, i) => (
                          <span key={i} className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {resumeData.content.certifications && resumeData.content.certifications.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold border-b mb-2">Certifications</h3>
                      {resumeData.content.certifications.map((cert, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{cert.name}</span>
                            {cert.date && <span className="text-sm">{cert.date}</span>}
                          </div>
                          {cert.issuer && <div className="text-sm">{cert.issuer}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {resumeData.content.projects && resumeData.content.projects.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-md font-semibold border-b mb-2">Projects</h3>
                      {resumeData.content.projects.map((project, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{project.name}</span>
                            {project.url && (
                              <a 
                                href={project.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600"
                              >
                                Link
                              </a>
                            )}
                          </div>
                          <p className="text-sm mt-1">{project.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ResumeEditor;