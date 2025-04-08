import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ResumeTemplate } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

function NewResume() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [resumeTitle, setResumeTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  // Fetch resume templates
  const { 
    data: templates,
    isLoading 
  } = useQuery<ResumeTemplate[]>({
    queryKey: ["/api/resume-templates"],
    enabled: !!user,
  });

  // Create new resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) {
        throw new Error("Please select a template");
      }
      
      if (!resumeTitle.trim()) {
        throw new Error("Please enter a resume title");
      }

      const response = await apiRequest(
        "POST",
        "/api/resumes",
        {
          userId: typeof user?.id === 'string' ? parseInt(user?.id, 10) : user?.id,
          title: resumeTitle,
          content: {}, // Empty content to be filled in the editor
          templateId: selectedTemplate, // already a number from state
          isOptimized: false
        }
      );
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Resume created",
        description: "Your new resume has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      navigate(`/resume-builder/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateResume = () => {
    createResumeMutation.mutate();
  };

  // Filter templates by category
  const freeTemplates = templates?.filter(template => template.category === 'free') || [];
  const premiumTemplates = templates?.filter(template => template.category === 'premium') || [];
  
  // Check if user has access to premium templates
  const hasPremiumAccess = user?.plan !== 'free';

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Create New Resume
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a template and get started with your new resume
        </p>
      </div>

      {/* Resume Title */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Resume Details</CardTitle>
            <CardDescription>Enter basic information for your new resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  placeholder="E.g., Senior Developer Resume, Marketing Position, etc."
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Selection */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Choose a Template</CardTitle>
            <CardDescription>Select a template for your resume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Free Templates */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Free Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {freeTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? "border-primary-500 ring-2 ring-primary-200"
                            : "border-gray-200 hover:border-primary-300"
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="aspect-w-16 aspect-h-9 mb-3">
                          {template.previewImage ? (
                            <img
                              src={template.previewImage}
                              alt={template.name}
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-gray-400">{template.name}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Premium Templates */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Premium Templates</h3>
                    {!hasPremiumAccess && (
                      <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                        Upgrade
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {premiumTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-4 relative ${
                          !hasPremiumAccess
                            ? "opacity-70 cursor-not-allowed"
                            : "cursor-pointer hover:border-primary-300"
                        } ${
                          selectedTemplate === template.id
                            ? "border-primary-500 ring-2 ring-primary-200"
                            : "border-gray-200"
                        }`}
                        onClick={() => {
                          if (hasPremiumAccess) {
                            setSelectedTemplate(template.id);
                          } else {
                            toast({
                              title: "Premium Feature",
                              description: "Upgrade your plan to access premium templates.",
                            });
                          }
                        }}
                      >
                        {!hasPremiumAccess && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                            Premium
                          </div>
                        )}
                        <div className="aspect-w-16 aspect-h-9 mb-3">
                          {template.previewImage ? (
                            <img
                              src={template.previewImage}
                              alt={template.name}
                              className="object-cover rounded"
                            />
                          ) : (
                            <div className="bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-gray-400">{template.name}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => navigate("/resume-builder")}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateResume} 
              disabled={!selectedTemplate || !resumeTitle.trim() || createResumeMutation.isPending}
            >
              {createResumeMutation.isPending ? "Creating..." : "Create Resume"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default NewResume;