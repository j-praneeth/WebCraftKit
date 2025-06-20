import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Resume } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ResumeCardProps {
  resume: Resume;
  onEdit: (id: number | string) => void;
  onDownload: (id: number | string) => void;
  onDelete: (id: number | string) => void;
}

export function ResumeCard({ resume, onEdit, onDownload, onDelete }: ResumeCardProps) {
  const lastUpdated = resume.lastUpdated 
    ? formatDistanceToNow(new Date(resume.lastUpdated), { addSuffix: true })
    : 'Unknown';
    
  const scoreColor = typeof resume.atsScore === "number" && resume.atsScore >= 80
    ? "text-green-700"
    : typeof resume.atsScore === "number" && resume.atsScore >= 50
    ? "text-yellow-700"
    : "text-red-700";
  const scoreBg = typeof resume.atsScore === "number" && resume.atsScore >= 80
    ? "bg-green-100"
    : typeof resume.atsScore === "number" && resume.atsScore >= 50
    ? "bg-yellow-100"
    : "bg-red-100";
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{resume.title}</h3>
            <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              {resume.isOptimized ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ATS Optimized
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Needs Review
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resume.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Delete Resume"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${scoreBg} ${scoreColor}`}>
                  {typeof resume.atsScore === "number" ? `ATS Score: ${resume.atsScore}%` : "ATS Score: N/A"}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-primary-200">
              <div 
                style={{ width: `${resume.atsScore}%` }} 
                className={cn("shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center", scoreBg)}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(resume.id)}
            className="flex items-center"
          >
            <i className="ri-edit-line mr-1"></i> Edit
          </Button>
          <Button 
            size="sm" 
            onClick={() => onDownload(resume.id)}
            className="flex items-center"
          >
            <i className="ri-download-line mr-1"></i> Download
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NewResumeCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5 flex flex-col items-center justify-center h-full text-center" style={{ minHeight: "200px" }}>
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <i className="ri-add-line text-primary-600 text-xl"></i>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Create New Resume</h3>
        <p className="mt-1 text-sm text-gray-500">Optimize for your next job application</p>
        <Button 
          className="mt-4" 
          onClick={onClick}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
