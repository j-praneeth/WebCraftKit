import { Button } from "@/components/ui/button";
import { JobPosting } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface JobCardProps {
  job: JobPosting;
  onSave: (jobId: number) => void;
  onApply: (jobId: number) => void;
}

export function JobCard({ job, onSave, onApply }: JobCardProps) {
  const postedTime = job.postDate 
    ? formatDistanceToNow(new Date(job.postDate), { addSuffix: true })
    : 'Unknown';
  
  // Determine match score badge color
  const getMatchBadgeColor = (score: number | undefined) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-green-100 text-green-800";
    return "bg-amber-100 text-amber-800";
  };

  const matchBadgeColor = getMatchBadgeColor(job.matchScore);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
              <i className="ri-building-4-line text-gray-500"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-md font-medium text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-500">{job.company}</p>
            </div>
          </div>
          {job.matchScore && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${matchBadgeColor}`}>
              {job.matchScore}% Match
            </span>
          )}
        </div>
        
        <div className="mt-4">
          {job.location && (
            <div className="flex items-center text-sm text-gray-500">
              <i className="ri-map-pin-line text-gray-400 mr-1"></i>
              {job.location}
            </div>
          )}
          {job.salary && (
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <i className="ri-money-dollar-circle-line text-gray-400 mr-1"></i>
              {job.salary}
            </div>
          )}
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <i className="ri-time-line text-gray-400 mr-1"></i>
            Posted {postedTime}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-sm text-gray-500 line-clamp-3">
            {job.description}
          </div>
        </div>
        
        {job.requirements && (
          <div className="mt-4 flex items-center space-x-2 flex-wrap">
            {(job.requirements as string[]).map((skill, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-1"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSave(job.id)}
            className="flex items-center"
          >
            Save
          </Button>
          <Button 
            size="sm" 
            onClick={() => onApply(job.id)}
            className="flex items-center"
          >
            Apply Now
          </Button>
        </div>
      </div>
    </div>
  );
}
