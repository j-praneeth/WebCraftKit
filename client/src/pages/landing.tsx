import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

function LandingPage() {
  const [, navigate] = useLocation();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

  const pricingPlans = [
    {
      name: "Free",
      description: "Get started with essential tools for your job search",
      price: { monthly: 0, yearly: 0 },
      features: [
        "1 Resume",
        "1 Cover Letter",
        "Basic Job Matching",
        "Limited Interview Questions"
      ],
      recommended: false,
      buttonText: "Get Started",
    },
    {
      name: "Professional",
      description: "Everything you need for a successful job search",
      price: { monthly: 9.99, yearly: 99.99 },
      features: [
        "Unlimited Resumes",
        "Unlimited Cover Letters",
        "Advanced Job Matching",
        "Unlimited Interview Questions",
        "Resume Analytics",
        "AI Optimization"
      ],
      recommended: true,
      buttonText: "Try Professional",
    },
    {
      name: "Enterprise",
      description: "Complete solution for serious job seekers",
      price: { monthly: 19.99, yearly: 199.99 },
      features: [
        "All Professional Features",
        "Mock Interviews with AI Feedback",
        "Priority Support",
        "Custom Resume Templates",
        "Team Management",
        "Advanced Analytics"
      ],
      recommended: false,
      buttonText: "Contact Sales",
    }
  ];

  const handleGetStarted = () => {
    navigate("/auth/register");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-primary-600"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6H4V18H20V6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 9H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 9V18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="ml-2 text-xl font-bold">ResuNext.ai</span>
              </div>
              <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <a href="#features" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Features
                </a>
                <a href="#pricing" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Pricing
                </a>
                <a href="#testimonials" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Testimonials
                </a>
              </nav>
            </div>
            <div className="flex items-center">
              <Link href="/auth/login">
                <Button variant="outline" className="mr-2">Sign in</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Elevate Your</span>
                  <span className="block text-primary-600">Job Search with AI</span>
                </h1>
                <p className="mt-6 text-lg text-gray-500">
                  ResuNext.ai is an AI-powered platform that helps you build ATS-friendly resumes, prepare for interviews, and match with your dream job.
                </p>
                <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      className="px-8 py-3 text-base font-medium"
                    >
                      Get Started for Free
                    </Button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a href="#features">
                      <Button
                        variant="outline"
                        size="lg"
                        className="px-8 py-3 text-base font-medium"
                      >
                        Learn More
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative mx-auto rounded-lg shadow-lg overflow-hidden">
                  <div className="w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-32 h-32 text-primary-500" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1"
                    >
                      <path 
                        d="M8 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2H8Z" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M14 2V8H20" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M16 13H8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M16 17H8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M10 9H9H8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                AI-Powered Career Tools
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Our platform offers everything you need to stand out in today's competitive job market.
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {/* Resume Builder */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Resume Builder</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Create ATS-friendly resumes with real-time AI optimization and keyword analysis.
                    </p>
                  </CardContent>
                </Card>

                {/* Cover Letter Generator */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Cover Letter Generator</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Generate personalized cover letters tailored to specific companies and job descriptions.
                    </p>
                  </CardContent>
                </Card>

                {/* Interview Preparation */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Interview Preparation</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Practice with AI-generated questions based on your resume and job description.
                    </p>
                  </CardContent>
                </Card>

                {/* Job Matching */}
                <Card className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Job Matching</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Get matched with jobs that fit your skills and experience with real-time scoring.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">Advanced AI Features</h2>
                <p className="mt-4 text-lg text-gray-500">
                  Our platform leverages the latest in AI technology to give you an edge in your job search.
                </p>
              </div>
              <div className="mt-12 lg:mt-0 lg:col-span-2">
                <div className="space-y-5">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">ATS-Optimization</h3>
                      <p className="mt-2 text-base text-gray-500">
                        Our AI analyzes job descriptions and optimizes your resume to pass Applicant Tracking Systems with a higher score.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">AI Mock Interviews</h3>
                      <p className="mt-2 text-base text-gray-500">
                        Practice with AI-powered mock interviews that analyze your responses and provide detailed feedback.
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">Career Analytics</h3>
                      <p className="mt-2 text-base text-gray-500">
                        Get insights into your job search progress, resume performance, and interview readiness.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section id="pricing" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Pricing Plans
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Choose the plan that's right for your career journey
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <Tabs
                defaultValue="monthly"
                value={billingInterval}
                onValueChange={(value) => setBillingInterval(value as "monthly" | "yearly")}
                className="w-full max-w-md"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
                  <TabsTrigger value="yearly">
                    Yearly Billing
                    <Badge variant="outline" className="ml-2 bg-primary-50 text-primary-700">
                      Save 16%
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`flex flex-col border rounded-lg shadow-sm divide-y divide-gray-200 ${plan.recommended ? 'border-primary-500 ring-2 ring-primary-500' : ''}`}>
                  <CardContent className="p-6">
                    {plan.recommended && (
                      <div className="mb-4">
                        <Badge className="bg-primary-50 text-primary-700 hover:bg-primary-50">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                    <p className="mt-4">
                      <span className="text-4xl font-extrabold text-gray-900">
                        ${plan.price[billingInterval].toFixed(2)}
                      </span>
                      <span className="text-base font-medium text-gray-500">
                        /{billingInterval === "monthly" ? "mo" : "yr"}
                      </span>
                    </p>
                    <ul className="mt-6 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex">
                          <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                          <span className="ml-3 text-sm text-gray-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8">
                      <Button 
                        variant={plan.recommended ? "default" : "outline"} 
                        className="w-full"
                        onClick={handleGetStarted}
                      >
                        {plan.buttonText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                What Our Users Say
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Success stories from job seekers who used ResuNext.ai
              </p>
            </div>

            <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
              {/* Testimonial 1 */}
              <Card className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <CardContent className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 15.585l6.146 3.233a.75.75 0 01-1.083.853l-6.063-3.192-6.063 3.192a.75.75 0 01-1.083-.853l6.146-3.233z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M7.354 1.146a.5.5 0 01.708 0l3.5 3.5a.5.5 0 010 .708l-3.5 3.5a.5.5 0 11-.708-.708L10.793 5H1.5a.5.5 0 010-1h9.293L7.354 1.854a.5.5 0 010-.708z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                    </div>
                    <p className="text-base text-gray-600">
                      "The resume optimization feature helped me get past ATS systems and land interviews at top tech companies. I received multiple offers within a month!"
                    </p>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-300 flex items-center justify-center text-white font-bold">
                        JD
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">James Davis</p>
                      <p className="text-sm text-gray-500">Software Engineer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 2 */}
              <Card className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <CardContent className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 15.585l6.146 3.233a.75.75 0 01-1.083.853l-6.063-3.192-6.063 3.192a.75.75 0 01-1.083-.853l6.146-3.233z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M7.354 1.146a.5.5 0 01.708 0l3.5 3.5a.5.5 0 010 .708l-3.5 3.5a.5.5 0 11-.708-.708L10.793 5H1.5a.5.5 0 010-1h9.293L7.354 1.854a.5.5 0 010-.708z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                    </div>
                    <p className="text-base text-gray-600">
                      "The mock interview feature transformed my interview performance. The AI feedback was spot-on and helped me improve with each practice session."
                    </p>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-300 flex items-center justify-center text-white font-bold">
                        SM
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Sarah Mitchell</p>
                      <p className="text-sm text-gray-500">Marketing Manager</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial 3 */}
              <Card className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <CardContent className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 15.585l6.146 3.233a.75.75 0 01-1.083.853l-6.063-3.192-6.063 3.192a.75.75 0 01-1.083-.853l6.146-3.233z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M7.354 1.146a.5.5 0 01.708 0l3.5 3.5a.5.5 0 010 .708l-3.5 3.5a.5.5 0 11-.708-.708L10.793 5H1.5a.5.5 0 010-1h9.293L7.354 1.854a.5.5 0 010-.708z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ))}
                    </div>
                    <p className="text-base text-gray-600">
                      "The cover letter generator saved me hours of time. It produced personalized, professional cover letters that matched each job application perfectly."
                    </p>
                  </div>
                  <div className="mt-6 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-300 flex items-center justify-center text-white font-bold">
                        RJ
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Robert Johnson</p>
                      <p className="text-sm text-gray-500">Financial Analyst</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to Transform Your Job Search?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-primary-100">
                Join thousands of job seekers who've found success with ResuNext.ai
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  className="px-8 py-3 text-base font-medium bg-white text-primary-600 hover:bg-primary-50"
                  onClick={handleGetStarted}
                >
                  Get Started for Free
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-white"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6H4V18H20V6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 9H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 9V18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="ml-2 text-xl font-bold text-white">ResuNext.ai</span>
              </div>
              <p className="mt-2 text-base text-gray-300">
                AI-powered career tools for the modern job seeker.
              </p>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Features</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Resume Builder</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Cover Letters</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Interview Prep</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Job Matching</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Guides</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Support</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Pricing</a></li>
              </ul>
            </div>
            
            <div className="col-span-1">
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">About</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between">
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0">
              &copy; {new Date().getFullYear()} ResuNext.ai. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;