import { Button } from "@/components/ui/button";
import { JobPosting } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from 'lucide-react';
import { MapPin, DollarSign, Calendar } from 'lucide-react';

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
  const getMatchBadgeColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-green-100 text-green-800";
    return "bg-amber-100 text-amber-800";
  };

  const matchBadgeColor = getMatchBadgeColor(job.matchScore);

  const handleApply = () => {
    if (job.source && job.source !== 'Internal' && job.url) {
      // For external jobs, validate URL before opening
      try {
        const url = new URL(job.url);
        // Ensure URL is from either LinkedIn or Adzuna
        if (url.hostname.includes('linkedin.com') || url.hostname.includes('adzuna.in')) {
          window.open(job.url, '_blank');
        } else {
          console.error('Invalid external job URL');
        }
      } catch (error) {
        console.error('Invalid URL:', error);
      }
    } else {
      // For internal jobs, use the normal application process
      onApply(job.id);
    }
  };

  // Get the appropriate source badge color
  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'LinkedIn':
        return 'bg-blue-100 text-blue-800';
      case 'Adzuna':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h3>
            <p className="text-sm text-gray-600">{job.company}</p>
          </div>

          <div className="space-y-2">
            {job.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span>{job.location}</span>
              </div>
            )}
            
            {job.salary && (
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                <span>{job.salary}</span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>Posted {postedTime}</span>
            </div>
          </div>

          <div className="text-sm text-gray-600 line-clamp-3">
            {job.description}
          </div>

          {Array.isArray(job.requirements) && job.requirements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((skill, index) => (
                <span 
                  key={index} 
                  className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded"
                >
                  {String(skill)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <Button 
          size="default"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleApply}
        >
          Apply on {job.source}
          {job.source !== 'Internal' && <ExternalLink className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
