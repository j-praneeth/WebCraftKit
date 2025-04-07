import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Resume, InterviewQuestion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { predictInterviewQuestions } from "@/lib/openai";

function InterviewPrep() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("behavioral");

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

  const behavioralQuestions = questions?.filter(q => q.category === "behavioral") || [];
  const technicalQuestions = questions?.filter(q => q.category === "technical") || [];

  const handleResumeSelect = (resumeId: number) => {
    setSelectedResumeId(resumeId);
  };

  const handleGenerateQuestions = async () => {
    if (!selectedResumeId) {
      toast({
        title: "Error",
        description: "Please select a resume to continue",
        variant: "destructive"
      });
      return;
    }

    if (!jobTitle) {
      toast({
        title: "Error",
        description: "Please enter a job title",
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

      const predictedQuestions = await predictInterviewQuestions(
        selectedResume.content,
        jobTitle
      );

      // Save the questions to the database
      const savedQuestions = [];

      // Save behavioral questions
      for (const q of predictedQuestions.behavioral) {
        const response = await apiRequest("POST", "/api/interview-questions", {
          question: q.question,
          suggestedAnswer: q.suggestedAnswer,
          category: "behavioral"
        });
        
        if (response.ok) {
          const savedQuestion = await response.json();
          savedQuestions.push(savedQuestion);
        }
      }

      // Save technical questions
      for (const q of predictedQuestions.technical) {
        const response = await apiRequest("POST", "/api/interview-questions", {
          question: q.question,
          suggestedAnswer: q.suggestedAnswer,
          category: "technical"
        });
        
        if (response.ok) {
          const savedQuestion = await response.json();
          savedQuestions.push(savedQuestion);
        }
      }

      // Invalidate the questions cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/interview-questions"] });

      toast({
        title: "Questions generated",
        description: `Generated ${savedQuestions.length} interview questions based on your resume`
      });

    } catch (error) {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate interview questions",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Interview Preparation
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Prepare for interviews with AI-generated questions and suggested answers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Generate Questions Section */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Generate Questions</CardTitle>
            <CardDescription>Create personalized interview questions based on your resume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Target Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Developer"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Resume</Label>
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
              
              <Button 
                onClick={handleGenerateQuestions} 
                disabled={isGenerating || !selectedResumeId}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : "Generate Questions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Questions and Answers Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Interview Questions</CardTitle>
            <CardDescription>Practice these questions to prepare for your interview</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingQuestions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : questions && questions.length > 0 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                <TabsContent value="behavioral" className="mt-4">
                  {behavioralQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {behavioralQuestions.map(question => (
                        <div key={question.id} className="bg-gray-50 p-4 rounded-md">
                          <h4 className="text-sm font-medium text-gray-900">{question.question}</h4>
                          <div className="mt-2 flex">
                            <button 
                              type="button" 
                              onClick={() => handleShowSuggestion(question.id)}
                              className="text-sm font-medium text-accent-600 hover:text-accent-700"
                            >
                              <i className="ri-question-answer-line mr-1"></i> See AI suggestion
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No behavioral questions generated yet</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="technical" className="mt-4">
                  {technicalQuestions.length > 0 ? (
                    <div className="space-y-3">
                      {technicalQuestions.map(question => (
                        <div key={question.id} className="bg-gray-50 p-4 rounded-md">
                          <h4 className="text-sm font-medium text-gray-900">{question.question}</h4>
                          <div className="mt-2 flex">
                            <button 
                              type="button" 
                              onClick={() => handleShowSuggestion(question.id)}
                              className="text-sm font-medium text-accent-600 hover:text-accent-700"
                            >
                              <i className="ri-question-answer-line mr-1"></i> See AI suggestion
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No technical questions generated yet</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent-100">
                  <i className="ri-questionnaire-line text-accent-600 text-xl"></i>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
                <p className="mt-1 text-sm text-gray-500">Generate questions based on your resume and job title</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interview Tips Section */}
      <div className="mt-10">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Interview Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Before the Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Research the company thoroughly</li>
                <li>Review the job description and requirements</li>
                <li>Prepare your STAR stories (Situation, Task, Action, Result)</li>
                <li>Practice common interview questions</li>
                <li>Prepare thoughtful questions to ask the interviewer</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-md">During the Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Make a strong first impression with professional appearance</li>
                <li>Maintain good eye contact and positive body language</li>
                <li>Listen carefully to questions before answering</li>
                <li>Use the STAR method for behavioral questions</li>
                <li>Be specific about your accomplishments</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-md">After the Interview</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Send a thank-you email within 24 hours</li>
                <li>Reflect on your performance and learn from it</li>
                <li>Follow up if you haven't heard back in a week</li>
                <li>Continue your job search until you have an offer</li>
                <li>Prepare for potential follow-up interviews</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default InterviewPrep;
