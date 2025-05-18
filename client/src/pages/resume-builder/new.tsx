import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { templates, getTemplatesByPlan, TemplateDefinition } from "@/lib/templates/index";
import { renderLatexToHTML, LaTeXTemplate } from "@/lib/latex-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function NewResume() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [resumeTitle, setResumeTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "latex" | "html">("all");
  
  // Get all templates
  const allTemplates = Object.values(templates);
  
  // Debug logging
  console.log('Templates object:', templates);
  console.log('All templates array:', allTemplates);
  console.log('Template categories:', allTemplates.map(t => t.category));
  
  // Filter templates by category
  const filterTemplates = (templates: TemplateDefinition[], category: string) => {
    const filtered = templates.filter(template => {
      const matches = template.category === category;
      console.log(`Template ${template.id}: category=${template.category}, matches=${matches}`);
      return matches;
    });
    console.log(`Filtered ${category} templates:`, filtered.map(t => t.id));
    return filtered;
  };

  const freeTemplates = filterTemplates(allTemplates, 'free');
  const professionalTemplates = filterTemplates(allTemplates, 'professional');
  const enterpriseTemplates = filterTemplates(allTemplates, 'enterprise');

  // Debug template counts
  console.log('All Templates:', allTemplates.length);
  console.log('Free Templates:', freeTemplates.length, freeTemplates.map(t => t.id));
  console.log('Professional Templates:', professionalTemplates.length, professionalTemplates.map(t => t.id));
  console.log('Enterprise Templates:', enterpriseTemplates.length, enterpriseTemplates.map(t => t.id));

  // Check if user has access to professional/enterprise templates
  const hasProfessionalAccess = user?.plan === 'professional' || user?.plan === 'enterprise';
  const hasEnterpriseAccess = user?.plan === 'enterprise';

  // Create new resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) {
        throw new Error("Please select a template");
      }
      
      if (!resumeTitle.trim()) {
        throw new Error("Please enter a title for your resume");
      }
      const response = await apiRequest("POST", "/api/resumes", {
        title: resumeTitle,
        templateId: selectedTemplate,
      });
      const data = await response.json();
      return data;
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

  const renderTemplatePreview = (template: TemplateDefinition) => {
    return (
      <div className="relative group">
        <img
          src={template.previewImage}
          alt={template.name}
          className="object-cover rounded-lg w-full aspect-[1.414/1] shadow-sm transition-all duration-200 group-hover:shadow-md"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
          <Button variant="secondary" className="bg-white/90 hover:bg-white">
            Preview Template
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Choose a Template</h1>
          <p className="text-gray-600 mt-2">Select a template for your resume</p>
        </div>

        {/* Resume Title Input */}
        <div className="mb-6">
          <Label htmlFor="resumeTitle" className="text-base font-medium">Resume Title</Label>
          <Input
            id="resumeTitle"
            placeholder="E.g., Software Developer Resume"
            value={resumeTitle}
            onChange={(e) => setResumeTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "latex" | "html")}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="latex">LaTeX</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          <div className="space-y-8">
            {/* Free Templates Section */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Free Templates ({freeTemplates.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {freeTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-xl p-4 relative cursor-pointer hover:shadow-lg hover:border-primary-300 ${
                      selectedTemplate === template.id
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedTemplate(template.id as keyof typeof templates)}
                  >
                    <img
                      src={template.previewImage}
                      alt={template.name}
                      className="w-full aspect-[3/2] object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    {/* <Badge className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700">
                      LaTeX
                    </Badge> */}
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Templates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Professional Templates ({professionalTemplates.length})</h2>
                {!hasProfessionalAccess && (
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    Upgrade to Professional
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {professionalTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-xl p-4 relative ${
                      !hasProfessionalAccess
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer hover:shadow-lg hover:border-primary-300"
                    } ${
                      selectedTemplate === template.id
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      if (hasProfessionalAccess) {
                        setSelectedTemplate(template.id as keyof typeof templates);
                      } else {
                        toast({
                          title: "Professional Feature",
                          description: "Upgrade to Professional plan to access these templates.",
                        });
                      }
                    }}
                  >
                    <img
                      src={template.previewImage}
                      alt={template.name}
                      className="w-full aspect-[3/2] object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    {!hasProfessionalAccess && (
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        Professional
                      </Badge>
                    )}
                    <Badge className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700">
                    Premium
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Templates Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Enterprise Templates ({enterpriseTemplates.length})</h2>
                {!hasEnterpriseAccess && (
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    Upgrade to Enterprise
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {enterpriseTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`border rounded-xl p-4 relative ${
                      !hasEnterpriseAccess
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer hover:shadow-lg hover:border-primary-300"
                    } ${
                      selectedTemplate === template.id
                        ? "border-primary-500 ring-2 ring-primary-200"
                        : "border-gray-200"
                    }`}
                    onClick={() => {
                      if (hasEnterpriseAccess) {
                        setSelectedTemplate(template.id as keyof typeof templates);
                      } else {
                        toast({
                          title: "Enterprise Feature",
                          description: "Upgrade to Enterprise plan to access these templates.",
                        });
                      }
                    }}
                  >
                    <img
                      src={template.previewImage}
                      alt={template.name}
                      className="w-full aspect-[3/2] object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    {!hasEnterpriseAccess && (
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        Enterprise
                      </Badge>
                    )}
                    <Badge className="absolute top-2 left-2 bg-blue-600 hover:bg-blue-700">
                      Premium
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tabs>

        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Cancel
          </Button>
          <Button
            onClick={() => createResumeMutation.mutate()}
            disabled={!selectedTemplate || !resumeTitle.trim() || createResumeMutation.isPending}
          >
            Create Resume
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default NewResume;