import { Button } from "@/components/ui/button";
import { InterviewQuestion, MockInterview } from "@shared/schema";
import { format } from "date-fns";

interface InterviewQuestionsCardProps {
  questions: InterviewQuestion[];
  onGenerateMore: () => void;
  onShowSuggestion: (questionId: number) => void;
}

export function InterviewQuestionsCard({ 
  questions, 
  onGenerateMore, 
  onShowSuggestion 
}: InterviewQuestionsCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-accent-100 rounded-full p-3">
            <i className="ri-questionnaire-line text-accent-600 text-xl"></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">AI-Predicted Questions</h3>
            <p className="text-sm text-gray-500">Based on your resume and target job</p>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          {questions.length > 0 ? (
            questions.map((question) => (
              <div key={question.id} className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-gray-900">{question.question}</h4>
                <div className="mt-2 flex">
                  <button 
                    type="button" 
                    onClick={() => onShowSuggestion(question.id)}
                    className="text-sm font-medium text-accent-600 hover:text-accent-700"
                  >
                    <i className="ri-question-answer-line mr-1"></i> See AI suggestion
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No questions generated yet</p>
            </div>
          )}
          
          <div className="text-center">
            <Button variant="secondary" onClick={onGenerateMore} className="bg-accent-500 hover:bg-accent-600 text-white">
              Generate More Questions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MockInterviewCardProps {
  latestInterview?: MockInterview;
  onStartMockInterview: () => void;
}

export function MockInterviewCard({ 
  latestInterview, 
  onStartMockInterview 
}: MockInterviewCardProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-primary-100 rounded-full p-3">
            <i className="ri-vidicon-line text-primary-600 text-xl"></i>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">AI Video Mock Interview</h3>
            <p className="text-sm text-gray-500">Practice and get real-time feedback</p>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-center bg-gray-50 rounded-md p-8" style={{ minHeight: "180px" }}>
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
              <i className="ri-vidicon-line text-primary-600 text-xl"></i>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Start a Mock Interview Session</h3>
            <p className="mt-1 text-sm text-gray-500">Our AI will evaluate your performance and provide feedback</p>
            <div className="mt-4">
              <Button onClick={onStartMockInterview}>
                Start Practice
              </Button>
            </div>
          </div>
        </div>
        
        {latestInterview && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Previous Results</h4>
            <div className="bg-gray-50 rounded-md p-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">{latestInterview.title}</p>
                <p className="text-xs text-gray-500">
                  {format(new Date(latestInterview.date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="text-sm font-medium text-secondary-600">
                {latestInterview.score}% Score
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
