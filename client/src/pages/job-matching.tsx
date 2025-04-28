import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { JobPosting, JobApplication } from "@shared/schema";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/ui/spinner';
import { AlertCircle, Briefcase, MapPin, Calendar, DollarSign, CheckCircle, Clock, X } from 'lucide-react';

export default function JobMatching() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommended' | 'applications'>('recommended');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job postings
        const jobsResponse = await fetch('/api/jobs');
        const jobsData = await jobsResponse.json();
        
        // Fetch job applications for the current user
        const applicationsResponse = await fetch(`/api/job-applications?userId=${user.id}`);
        const applicationsData = await applicationsResponse.json();
        
        setJobs(jobsData);
        setApplications(applicationsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load jobs and applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const handleApplyForJob = async (jobId: number) => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          jobId,
          status: 'applied',
          appliedDate: new Date(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to apply for job');
      }
      
      const newApplication = await response.json();
      setApplications([...applications, newApplication]);
      
      // Show success message or notification
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying for job:', err);
      setError('Failed to submit application. Please try again.');
    }
  };
  
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const isJobAppliedFor = (jobId: number) => {
    return applications.some(app => app.jobPostingId === jobId.toString());
  };

  
if (loading) {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
      <span className="ml-2">Loading jobs...</span>
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Job Dashboard</h1>
      
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'recommended' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('recommended')}
        >
          Recommended Jobs
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'applications' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('applications')}
        >
          My Applications
        </button>
      </div>
      
      {activeTab === 'recommended' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">No jobs found matching your profile.</p>
          ) : (
            jobs.map((job) => (
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
                    <Button onClick={() => handleApplyForJob(job.id)} className="w-full">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Apply Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
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
            applications.map((application) => {
              const job = jobs.find(j => j.id.toString() === application.jobPostingId);
              if (!job) return null;
              
              return (
                <Card key={application.id} className="overflow-hidden">
                  <div className={`h-2 ${getStatusColor(application.status).split(' ')[0]}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Applied on {formatDate(application.appliedDate)}</span>
                      </div>
                      {application.lastUpdated && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Last updated {formatDate(application.lastUpdated)}</span>
                        </div>
                      )}
                    </div>
                    
                    {application.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm italic text-gray-700">{application.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Implementation for updating application status
                          navigate(`/job-applications/${application.id}`);
                        }}
                      >
                        Update Status
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Implementation for adding notes
                          navigate(`/job-applications/${application.id}/notes`);
                        }}
                      >
                        Add Notes
                      </Button>
                      {job.url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => job.url ? window.open(job.url, '_blank') : undefined}
                        >
                          View Original Post
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}