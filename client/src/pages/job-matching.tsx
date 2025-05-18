import React, { useState, useEffect, ChangeEvent } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import type { JobPosting, JobApplication } from "@shared/schema";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';
import { AlertCircle, Briefcase, MapPin, Calendar, DollarSign, CheckCircle, Clock, X, Search, Filter, SortAsc, ChevronLeft } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { Label } from '../components/ui/label';
import { FileUpload } from '../components/ui/file-upload';

// Job status options
const JOB_STATUSES = [
  'applied',
  'interviewing',
  'offered',
  'rejected',
  'accepted',
  'declined',
  'cancelled'
] as const;

type JobStatus = typeof JOB_STATUSES[number];

// Type for sorting fields
type SortableField = keyof Pick<JobPosting, 'postDate' | 'matchScore' | 'salary'>;

// Sorting options
const SORT_OPTIONS = {
  'newest': { field: 'postDate' as SortableField, order: 'desc' as const },
  'oldest': { field: 'postDate' as SortableField, order: 'asc' as const },
  'matchScore': { field: 'matchScore' as SortableField, order: 'desc' as const },
  'salary': { field: 'salary' as SortableField, order: 'desc' as const }
} as const;

// Custom Input component with icon support
const InputWithIcon: React.FC<{
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
}> = ({ value, onChange, placeholder, icon }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
      {icon}
    </div>
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="pl-10"
    />
  </div>
);

// Extended types
interface ExtendedJobApplication extends Omit<JobApplication, 'status'> {
  status: JobStatus;
  job?: JobPosting;
}

export default function JobMatching() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<ExtendedJobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'applications'>('recommended');
  
  // New state variables for enhanced features
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortOption, setSortOption] = useState<keyof typeof SORT_OPTIONS>('newest');
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    coverLetter: '',
    phoneNumber: '',
    cvFile: null as File | null,
    additionalNotes: ''
  });
  const [applicationToCancel, setApplicationToCancel] = useState<ExtendedJobApplication | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job postings with search and filter parameters
        const searchParams = new URLSearchParams({
          ...(searchQuery && { search: searchQuery }),
          ...(filterLocation && { location: filterLocation }),
          sort: sortOption
        });
        
        const jobsResponse = await fetch(`/api/jobs?${searchParams}`);
        const jobsData = await jobsResponse.json();
        
        // Fetch job applications for the current user
        const applicationsResponse = await fetch(`/api/job-applications?userId=${user.id}`);
        const applicationsData = await applicationsResponse.json();
        
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load jobs and applications. Please try again.');
        // Initialize with empty arrays on error
        setJobs([]);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate, searchQuery, filterLocation, sortOption]);

  const handleApplyForJob = async (job: JobPosting) => {
    if (!user) return;
    
    // For external jobs (like from Adzuna), redirect to their application page
    if (job.source !== 'Internal' && job.url) {
      window.open(job.url, '_blank');
      return;
    }

    // For internal jobs, open our application dialog
    setSelectedJob(job);
    setIsApplyDialogOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!user || !selectedJob) return;
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('userId', user.id.toString());
      formData.append('jobId', selectedJob.id.toString());
      formData.append('coverLetter', applicationForm.coverLetter);
      formData.append('phoneNumber', applicationForm.phoneNumber);
      formData.append('additionalNotes', applicationForm.additionalNotes);
      formData.append('source', selectedJob.source || 'Internal');
      
      // Add job details for external jobs
      if (selectedJob.source !== 'Internal') {
        formData.append('jobTitle', selectedJob.title);
        formData.append('company', selectedJob.company);
        formData.append('jobUrl', selectedJob.url || '');
        formData.append('location', selectedJob.location || '');
      }
      
      if (applicationForm.cvFile) {
        formData.append('cv', applicationForm.cvFile);
      }
      
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit application');
      }
      
      const newApplication = await response.json();
      
      // Add the job details to the application object
      const applicationWithJob = {
        ...newApplication,
        job: selectedJob
      };
      
      setApplications([...applications, applicationWithJob]);
      
      setIsApplyDialogOpen(false);
      setApplicationForm({
        coverLetter: '',
        phoneNumber: '',
        cvFile: null,
        additionalNotes: ''
      });
      
      toast({
        title: "Application Submitted",
        description: "Your job application has been submitted successfully! We'll notify you of any updates.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error submitting application:', err);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (dateString: Date | string) => {
    try {
      // Handle ISO string format from Adzuna API
      const date = typeof dateString === 'string' 
        ? new Date(dateString.replace(/Z$/, '')) // Remove trailing Z if present
        : dateString;
      
      // Validate if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'interviewing':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800';
      case 'declined':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const isJobAppliedFor = (jobId: string | number) => {
    // Add safety check to ensure applications is an array and handle both string and number IDs
    return Array.isArray(applications) && applications.some(app => 
      app.jobPostingId === jobId.toString() || app.jobPostingId === jobId
    );
  };

  const filteredJobs = jobs.filter(job => {
    // Filter out jobs without URLs (unavailable jobs)
    if (job.source !== 'Internal' && !job.url) {
      return false;
    }

    const matchesSearch = searchQuery ? 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesLocation = filterLocation ?
      job.location?.toLowerCase().includes(filterLocation.toLowerCase())
      : true;

    // Additional check for job validity
    const isValidJob = job.title && job.company && 
      (job.source === 'Internal' || ['Adzuna', 'LinkedIn'].includes(job.source ?? ''));

    return matchesSearch && matchesLocation && isValidJob;
  });

  // Sort jobs with LinkedIn and Internal jobs first, then Adzuna
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    // First sort by source priority
    const sourceOrder = { 'LinkedIn': 0, 'Internal': 1, 'Adzuna': 2 };
    const sourceComparison = (sourceOrder[a.source as keyof typeof sourceOrder] || 3) - 
                           (sourceOrder[b.source as keyof typeof sourceOrder] || 3);
    
    if (sourceComparison !== 0) return sourceComparison;

    // Then apply the user's selected sort option
    const { field, order } = SORT_OPTIONS[sortOption];
    const aValue = (a[field] ?? '').toString();
    const bValue = (b[field] ?? '').toString();
    
    return order === 'desc' 
      ? bValue.localeCompare(aValue)
      : aValue.localeCompare(bValue);
  });

  // Update the handleCancelApplication function
  const handleCancelApplication = async () => {
    if (!applicationToCancel) return;

    try {
      const response = await fetch(`/api/job-applications/${applicationToCancel.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled',
          notes: 'Application cancelled by user'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel application');
      }

      // Update the application status in the local state
      setApplications(applications.map(app => 
        app.id === applicationToCancel.id 
          ? { ...app, status: 'cancelled' as JobStatus, lastUpdated: new Date() }
          : app
      ));
      
      setIsCancelDialogOpen(false);
      
      toast({
        title: "Application Cancelled",
        description: "Your job application has been cancelled successfully.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error cancelling application:', err);
      toast({
        title: "Error",
        description: "Failed to cancel application. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Job Dashboard</h1>
        </div>

        {/* Skeleton for stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Skeleton for tabs */}
        <div className="flex border-b mb-6">
          <div className="px-6 py-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="px-6 py-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton for search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-full sm:w-64">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-full sm:w-48">
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton for job cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center">
                  <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
                  <div className="h-4 w-36 bg-gray-200 rounded"></div>
                </div>
                <div className="h-16 bg-gray-200 rounded mt-4"></div>
                <div className="flex gap-2 mt-3">
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto py-6 px-4 sm:px-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mr-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Job Dashboard</h1>
      </div>
      
      {/* Job Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Applications</h3>
          <p className="text-2xl font-semibold mt-1">{applications.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Applications</h3>
          <p className="text-2xl font-semibold mt-1">
            {applications.filter(app => !['rejected', 'accepted', 'declined'].includes(app.status)).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Interviews Scheduled</h3>
          <p className="text-2xl font-semibold mt-1">
            {applications.filter(app => app.status === 'interviewing').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Offers Received</h3>
          <p className="text-2xl font-semibold mt-1">
            {applications.filter(app => app.status === 'offered').length}
          </p>
        </div>
      </div>

      <div className="flex border-b mb-6">
        <button
          className={`px-6 py-2 font-medium text-sm ${
            activeTab === 'recommended' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('recommended')}
        >
          Recommended Jobs
        </button>
        <button
          className={`px-6 py-2 font-medium text-sm ${
            activeTab === 'applications' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('applications')}
        >
          My Applications
        </button>
      </div>
      
      {activeTab === 'recommended' && (
        <>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder="Filter by location"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select 
                value={sortOption} 
                onValueChange={(value: string) => setSortOption(value as keyof typeof SORT_OPTIONS)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Newest First" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="matchScore">Best Match</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {sortedJobs.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your search filters</p>
              </div>
            ) : (
              sortedJobs.map((job) => (
                <Card key={job.id} className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription className="mt-1">{job.company}</CardDescription>
                      </div>
                      {job.matchScore && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {job.matchScore}% Match
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-3">
                      {job.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {job.salary && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Posted {formatDate(job.postDate)}</span>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-700 line-clamp-3">{job.description}</p>
                      </div>
                      {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.requirements.map((req, idx) => (
                            <Badge key={idx} variant="secondary">{req}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isJobAppliedFor(job.id) ? (
                      <Button variant="outline" disabled className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Applied
                      </Button>
                    ) : (
                      <Button onClick={() => handleApplyForJob(job)} className="w-full">
                        <Briefcase className="h-4 w-4 mr-2" />
                        {job.source === 'Internal' ? 'Apply Now' : 'Apply on ' + job.source}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </>
      )}
      
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {applications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Briefcase className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No applications yet</h3>
              <p className="mt-2 text-gray-500">Start applying to jobs to track your applications here.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setActiveTab('recommended')}
              >
                Browse Jobs
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((application) => {
                      const jobDetails = application.job || jobs.find(j => j.id.toString() === application.jobPostingId);
                      const displayJob = jobDetails || {
                        id: application.jobPostingId,
                        title: application.jobTitle || 'Job Posting',
                        company: application.company || 'Company',
                        source: application.source || 'Unknown',
                        url: application.jobUrl
                      };
                      
                      // Check if application can be cancelled (only if status is 'applied')
                      const canCancel = application.status === 'applied';
                      
                      return (
                        <tr key={application.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">{displayJob.title}</div>
                              <div className="text-sm text-gray-500">{displayJob.company}</div>
                              <div className="text-xs text-gray-400">{displayJob.source}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(application.status)}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(application.appliedDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.lastUpdated ? formatDate(application.lastUpdated) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              {displayJob.url && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => displayJob.url ? window.open(displayJob.url, '_blank') : undefined}
                                >
                                  View Job
                                </Button>
                              )}
                              {canCancel && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setApplicationToCancel(application);
                                    setIsCancelDialogOpen(true);
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
            <DialogDescription>
              Please provide the following information to submit your application to {selectedJob?.company}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Upload CV/Resume</Label>
              <FileUpload
                accept=".pdf,.doc,.docx"
                onChange={(file: File | null) => setApplicationForm(prev => ({ ...prev, cvFile: file }))}
              />
              <p className="text-sm text-gray-500">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
            </div>

            <div className="space-y-2">
              <Label>Cover Letter</Label>
              <Textarea
                value={applicationForm.coverLetter}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Write a brief cover letter..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={applicationForm.phoneNumber}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={applicationForm.additionalNotes}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Any additional information you'd like to share..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsApplyDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitApplication}
              disabled={!applicationForm.cvFile}
            >
              Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Cancel Confirmation Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your application for {applicationToCancel?.job?.title || applicationToCancel?.jobTitle}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Application
            </Button>
            <Button variant="destructive" onClick={handleCancelApplication}>
              Yes, Cancel Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}