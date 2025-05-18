import axios from 'axios';
import { JobPosting } from '@shared/schema';

// Define supported job board APIs
const JOB_APIS = {
  ADZUNA: 'https://api.adzuna.com/v1/api/jobs',
  LINKEDIN: 'https://api.linkedin.com/v2/jobs/search'
} as const;

interface ExternalJobSearchParams {
  query?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export class ExternalJobService {
  private apiKeys: {
    adzuna?: {
      appId: string;
      apiKey: string;
    };
    linkedin?: {
      clientId: string;
      clientSecret: string;
      accessToken: string;
      refreshToken: string;
    };
  };

  constructor(apiKeys?: { 
    adzuna?: { appId: string; apiKey: string; };
    linkedin?: {
      clientId: string;
      clientSecret: string;
      accessToken: string;
      refreshToken: string;
    };
  }) {
    this.apiKeys = apiKeys || {};
  }

  async searchAdzunaJobs({ query, location, page = 1, limit = 10 }: ExternalJobSearchParams): Promise<JobPosting[]> {
    try {
      if (!this.apiKeys.adzuna?.appId || !this.apiKeys.adzuna?.apiKey) {
        console.warn('Adzuna API credentials not configured');
        return [];
      }

      const country = 'in'; // Set region to India
      const response = await axios.get(
        `${JOB_APIS.ADZUNA}/${country}/search/${page}`, {
          params: {
            app_id: this.apiKeys.adzuna.appId,
            app_key: this.apiKeys.adzuna.apiKey,
            what: query,
            where: location,
            results_per_page: limit,
            'content-type': 'application/json'
          }
        }
      );

      if (!response.data?.results) {
        return [];
      }

      // Filter out jobs that are no longer available
      const availableJobs = response.data.results.filter((job: any) => 
        job.redirect_url && !job.redirect_url.includes('job-expired')
      );

      return availableJobs.map((job: any) => this.mapAdzunaJobToJobPosting(job));
    } catch (error) {
      console.error('Error fetching Adzuna jobs:', error);
      return [];
    }
  }

  private async refreshLinkedInToken(): Promise<string | null> {
    try {
      if (!this.apiKeys.linkedin?.clientId || !this.apiKeys.linkedin?.clientSecret || !this.apiKeys.linkedin?.refreshToken) {
        console.warn('LinkedIn OAuth credentials not configured');
        return null;
      }

      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.apiKeys.linkedin.refreshToken,
          client_id: this.apiKeys.linkedin.clientId,
          client_secret: this.apiKeys.linkedin.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data?.access_token) {
        this.apiKeys.linkedin.accessToken = response.data.access_token;
        return response.data.access_token;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing LinkedIn token:', error);
      return null;
    }
  }

  private async searchLinkedInJobs(params: ExternalJobSearchParams): Promise<JobPosting[]> {
    try {
      if (!this.apiKeys.linkedin?.accessToken) {
        // Fallback to public jobs feed
        return this.searchPublicLinkedInJobs(params);
      }

      const makeRequest = async (token: string) => {
        return axios.get(JOB_APIS.LINKEDIN, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202304'
          },
          params: {
            keywords: params.query || '',
            location: params.location || 'Worldwide',
            count: params.limit || 10
          }
        });
      };

      try {
        // Try with current token
        const response = await makeRequest(this.apiKeys.linkedin.accessToken);
        if (response.data?.elements) {
          return response.data.elements
            .filter((job: any) => job && job.id && job.title)
            .map((job: any) => this.mapLinkedInJobToJobPosting(job));
        }
      } catch (error: any) {
        // If token expired, try refreshing
        if (error.response?.status === 401) {
          const newToken = await this.refreshLinkedInToken();
          if (newToken) {
            const retryResponse = await makeRequest(newToken);
            if (retryResponse.data?.elements) {
              return retryResponse.data.elements
                .filter((job: any) => job && job.id && job.title)
                .map((job: any) => this.mapLinkedInJobToJobPosting(job));
            }
          }
        }
        throw error;
      }

      return [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.error('LinkedIn API authentication failed - invalid credentials');
      } else {
        console.error('Error fetching LinkedIn jobs:', error);
      }
      return [];
    }
  }

  private async searchPublicLinkedInJobs(params: ExternalJobSearchParams): Promise<JobPosting[]> {
    try {
      // Use the public jobs feed API
      const response = await axios.get('https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search', {
        params: {
          keywords: params.query || '',
          location: params.location || 'Worldwide',
          start: 0,
          count: params.limit || 10,
          f_TPR: 'r86400', // Last 24 hours
        },
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (compatible; JobSearchBot/1.0)'
        }
      });

      if (typeof response.data === 'string') {
        // Parse the HTML response to extract job data
        const jobs = this.parseLinkedInJobsHtml(response.data);
        return jobs.map(job => ({
          id: parseInt(job.id, 10), // Convert string ID to number
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description || null,
          salary: null,
          requirements: {},
          postDate: new Date(),
          source: 'LinkedIn',
          url: `https://www.linkedin.com/jobs/view/${job.id}`,
          matchScore: null
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching public LinkedIn jobs:', error);
      return [];
    }
  }

  private parseLinkedInJobsHtml(html: string): Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    description?: string;
  }> {
    const jobs: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      description?: string;
    }> = [];

    try {
      // Extract job cards using regex
      const jobCards = html.match(/<div class="base-card[^>]*?>[\s\S]*?<\/div>/g) || [];
      
      for (const card of jobCards) {
        const idMatch = card.match(/data-job-id="([^"]+)"/);
        const titleMatch = card.match(/base-search-card__title"[^>]*?>([^<]+)</);
        const companyMatch = card.match(/base-search-card__subtitle"[^>]*?>([^<]+)</);
        const locationMatch = card.match(/job-search-card__location"[^>]*?>([^<]+)</);
        
        if (idMatch && titleMatch && companyMatch) {
          jobs.push({
            id: idMatch[1],
            title: titleMatch[1].trim(),
            company: companyMatch[1].trim(),
            location: locationMatch ? locationMatch[1].trim() : 'Remote',
          });
        }
      }
    } catch (error) {
      console.error('Error parsing LinkedIn jobs HTML:', error);
    }

    return jobs;
  }

  async searchAllJobs(params: ExternalJobSearchParams): Promise<JobPosting[]> {
    const [adzunaJobs, linkedinJobs] = await Promise.all([
      this.searchAdzunaJobs(params),
      this.searchLinkedInJobs(params)
    ]);

    return [
      ...adzunaJobs.map(job => ({ ...job, source: 'Adzuna' })),
      ...linkedinJobs.map(job => ({ ...job, source: 'LinkedIn' }))
    ];
  }

  private mapAdzunaJobToJobPosting(job: any): JobPosting {
    return {
      id: job.id,
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      description: job.description,
      salary: job.salary_min && job.salary_max 
        ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.salary_currency || 'GBP'}/year`
        : null,
      requirements: job.category?.tag || [],
      postDate: new Date(job.created),
      source: 'Adzuna',
      url: job.redirect_url,
      matchScore: null
    };
  }

  private mapLinkedInJobToJobPosting(job: any): JobPosting {
    return {
      id: job.id.toString(), // Ensure ID is string
      title: job.title,
      company: job.company?.name || 'Unknown Company',
      location: job.location?.name || 'Remote',
      description: job.description || job.descriptionSnippet || '',
      salary: job.salaryInsights?.compensationRange 
        ? `${job.salaryInsights.compensationRange.min} - ${job.salaryInsights.compensationRange.max} ${job.salaryInsights.compensationRange.currency}/year`
        : null,
      requirements: this.extractRequirements(job.description || ''),
      postDate: new Date(job.postedAt || job.listedAt || Date.now()),
      source: 'LinkedIn',
      url: job.applyUrl || `https://www.linkedin.com/jobs/view/${job.id}`,
      matchScore: job.relevanceScore ? Math.round(job.relevanceScore * 100) : null
    };
  }

  private extractRequirements(description: string): string[] {
    // Simple requirement extraction based on common patterns
    const requirements: string[] = [];
    const lines = description.split('\n');

    let inRequirementsList = false;
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for requirement section headers
      if (trimmedLine.match(/requirements|qualifications|what you'll need/i)) {
        inRequirementsList = true;
        continue;
      }

      // Look for bullet points or numbered lists while in requirements section
      if (inRequirementsList && (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.match(/^\d+\./))) {
        const requirement = trimmedLine.replace(/^[•\-\d.]+\s*/, '').trim();
        if (requirement) {
          requirements.push(requirement);
        }
      }

      // End requirements section if we hit another header or empty line
      if (inRequirementsList && (trimmedLine === '' || trimmedLine.match(/^[A-Z][^a-z]*$/))) {
        inRequirementsList = false;
      }
    }

    return requirements;
  }
}

// Export a singleton instance
export const externalJobService = new ExternalJobService({
  adzuna: process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY ? {
    appId: process.env.ADZUNA_APP_ID,
    apiKey: process.env.ADZUNA_API_KEY
  } : undefined,
  linkedin: process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    refreshToken: process.env.LINKEDIN_REFRESH_TOKEN || ''
  } : undefined
}); 