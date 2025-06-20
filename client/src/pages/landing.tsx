import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Smooth scroll function
const smoothScroll = (target: string) => {
  const element = document.querySelector(target);
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
};

function LandingPage() {
  const [, navigate] = useLocation();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const pricingPlans = [
    {
      name: "Free",
      description: "Get started with essential tools for your job search",
      price: { monthly: 0, yearly: 0 },
      features: [
        "Unlimited Free Resume",
        "3 Cover Letter",
        "Basic Job Matching",
        "10 Limited Interview Questions"
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
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 transform-origin-0"
        style={{ scaleX }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Navigation */}
      <motion.header
        className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <motion.div 
                className="flex-shrink-0 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-blue-500"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M20 6H4V18H20V6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  <motion.path
                    d="M4 9H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                  />
                  <motion.path
                    d="M8 9V18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
                  />
                </svg>
                <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">ResuNext.ai</span>
              </motion.div>
              <nav className="hidden sm:ml-8 sm:flex sm:space-x-8">
                {["Features", "Pricing", "Testimonials"].map((item) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-300 hover:text-blue-400 transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      smoothScroll(`#${item.toLowerCase()}`);
                    }}
                  >
                    {item}
                  </motion.a>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/auth/login">
                  <Button 
                    variant="outline" 
                    className="border-blue-500/20 bg-gray-900/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 backdrop-blur-sm transition-all duration-300"
                  >
                    Sign in
                  </Button>
              </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-[0_0_15px_rgba(66,153,225,0.3)] hover:shadow-[0_0_25px_rgba(66,153,225,0.5)] transition-all duration-300">
                    Sign up
                  </Button>
              </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section 
          className="relative bg-gray-900 py-20 overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <motion.div 
                className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left"
                variants={fadeIn}
              >
                <motion.h1 
                  className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl"
                  variants={fadeIn}
                >
                  <motion.span 
                    className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Elevate Your
                  </motion.span>
                  <motion.span 
                    className="block mt-1 text-gray-100"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Job Search with AI
                  </motion.span>
                </motion.h1>
                <motion.p 
                  className="mt-6 text-lg text-gray-300"
                  variants={fadeIn}
                >
                  ResuNext.ai is an AI-powered platform that helps you build ATS-friendly resumes, prepare for interviews, and match with your dream job.
                </motion.p>
                <motion.div 
                  className="mt-8 sm:flex sm:justify-center lg:justify-start space-x-4"
                  variants={fadeIn}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      onClick={handleGetStarted}
                      className="px-8 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-[0_0_15px_rgba(66,153,225,0.3)] hover:shadow-[0_0_25px_rgba(66,153,225,0.5)] transition-all duration-300"
                    >
                      Get Started for Free
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <a href="#features">
                      <Button
                        variant="outline"
                        size="lg"
                        className="px-8 py-3 text-base font-medium border-blue-500/20 bg-gray-900/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 backdrop-blur-sm transition-all duration-300"
                      >
                        Learn More
                      </Button>
                    </a>
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div 
                className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center"
                variants={scaleIn}
              >
                <div className="relative mx-auto w-full rounded-lg shadow-lg overflow-hidden">
                  <motion.div 
                    className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    {/* Animated illustration */}
                    <motion.div
                      className="relative w-64 h-64"
                      animate={{ 
                        rotate: [0, 5, -5, 0],
                        y: [0, -10, 10, 0]
                      }}
                      transition={{ 
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                    <svg 
                      viewBox="0 0 24 24" 
                        className="w-full h-full text-blue-500" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1"
                    >
                        <motion.path 
                        d="M8 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2H8Z" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                      />
                        <motion.path 
                        d="M14 2V8H20" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                      />
                        <motion.path 
                        d="M16 13H8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease: "easeInOut", delay: 1 }}
                      />
                        <motion.path 
                        d="M16 17H8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease: "easeInOut", delay: 1.5 }}
                      />
                        <motion.path 
                          d="M10 9H8" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease: "easeInOut", delay: 2 }}
                      />
                    </svg>
                    </motion.div>
                  </motion.div>
                  </div>
              </motion.div>
                </div>
              </div>
          
          {/* Background decorative elements */}
          <motion.div 
            className="absolute top-0 right-0 -mt-20 -mr-20 hidden lg:block"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            <svg width="404" height="384" fill="none" viewBox="0 0 404 384">
              <defs>
                <pattern id="de316486-4a29-4312-bdfc-fbce2132a2c1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" className="text-blue-500" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="384" fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)" />
            </svg>
          </motion.div>
          <motion.div 
            className="absolute bottom-0 left-0 -mb-20 -ml-20 hidden lg:block"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <svg width="404" height="384" fill="none" viewBox="0 0 404 384">
              <defs>
                <pattern id="d3eb07ae-5182-43e6-857d-35c643af9034" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="4" height="4" className="text-purple-500" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="404" height="384" fill="url(#d3eb07ae-5182-43e6-857d-35c643af9034)" />
            </svg>
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section 
          id="features" 
          className="py-16 bg-gray-800 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              variants={fadeIn}
            >
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 sm:text-4xl">
                AI-Powered Career Tools
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
                Our platform offers everything you need to stand out in today's competitive job market.
              </p>
            </motion.div>

            <motion.div 
              className="mt-16"
              variants={staggerContainer}
            >
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    title: "Resume Builder",
                    description: "Create ATS-friendly resumes with real-time AI optimization and keyword analysis.",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )
                  },
                  {
                    title: "Cover Letter Generator",
                    description: "Generate personalized cover letters tailored to specific companies and job descriptions.",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  {
                    title: "Interview Preparation",
                    description: "Practice with AI-generated questions based on your resume and job description.",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )
                  },
                  {
                    title: "Job Matching",
                    description: "Get matched with jobs that fit your skills and experience with real-time scoring.",
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeIn}
                    custom={index}
                    whileHover={{ 
                      y: -10,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Card className="h-full border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-6">
                        <motion.div 
                          className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-4"
                          whileHover={{ 
                            rotate: [0, 10, -10, 0],
                            transition: { duration: 0.5 }
                          }}
                        >
                          {feature.icon}
                        </motion.div>
                        <h3 className="text-lg font-medium text-gray-100">{feature.title}</h3>
                        <p className="mt-2 text-base text-gray-400">
                          {feature.description}
                    </p>
                  </CardContent>
                </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            </div>

          {/* Background decoration */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,theme(colors.blue.500/10),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,theme(colors.purple.500/10),transparent_70%)]" />
          </motion.div>
        </motion.section>

        {/* Advanced Features */}
        <motion.section 
          className="py-16 bg-gray-800 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              <motion.div variants={fadeIn}>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500">
                  Advanced AI Features
                </h2>
                <p className="mt-4 text-lg text-gray-300">
                  Our platform leverages the latest in AI technology to give you an edge in your job search.
                </p>
              </motion.div>
              <div className="mt-12 lg:mt-0 lg:col-span-2">
                <motion.div 
                  className="space-y-8"
                  variants={staggerContainer}
                >
                  {[
                    {
                      title: "ATS-Optimization",
                      description: "Our AI analyzes job descriptions and optimizes your resume to pass Applicant Tracking Systems with a higher score.",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )
                    },
                    {
                      title: "AI Mock Interviews",
                      description: "Practice with AI-powered mock interviews that analyze your responses and provide detailed feedback.",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      )
                    },
                    {
                      title: "Career Analytics",
                      description: "Get insights into your job search progress, resume performance, and interview readiness.",
                      icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      )
                    }
                  ].map((feature, index) => (
                    <motion.div 
                      key={feature.title}
                      className="relative"
                      variants={fadeIn}
                      custom={index}
                    >
                      <motion.div
                        className="flex"
                        whileHover={{ x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex-shrink-0">
                          <motion.div 
                            className="flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                            whileHover={{ 
                              scale: 1.1,
                              rotate: [0, 10, -10, 0],
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            {feature.icon}
                          </motion.div>
                    </div>
                    <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-100">{feature.title}</h3>
                          <p className="mt-2 text-base text-gray-400">
                            {feature.description}
                      </p>
                    </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
                  </div>
                </div>
              </div>

          {/* Background decoration */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,theme(colors.blue.500/10),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,theme(colors.purple.500/10),transparent_70%)]" />
          </motion.div>
        </motion.section>

        {/* Pricing Plans */}
        <motion.section 
          id="pricing" 
          className="py-16 bg-gray-900 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              variants={fadeIn}
            >
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 sm:text-4xl">
                Pricing Plans
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
                Choose the plan that's right for your career journey
              </p>
            </motion.div>

            <motion.div 
              className="mt-8 flex justify-center"
              variants={fadeIn}
            >
              <Tabs
                defaultValue="monthly"
                value={billingInterval}
                onValueChange={(value) => setBillingInterval(value as "monthly" | "yearly")}
                className="w-full max-w-md"
              >
                <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-800 rounded-lg">
                  <TabsTrigger 
                    value="monthly"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Monthly Billing
                  </TabsTrigger>
                  <TabsTrigger 
                    value="yearly"
                    className="data-[state=active]:bg-gray-700 data-[state=active]:shadow-md rounded-md transition-all duration-300"
                  >
                    Yearly Billing
                    <Badge variant="outline" className="ml-2 bg-blue-900 text-blue-300">
                      Save 16%
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </motion.div>

            <motion.div 
              className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3"
              variants={staggerContainer}
            >
              {pricingPlans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  variants={fadeIn}
                  custom={index}
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card className={`flex flex-col h-full border-gray-700 bg-gradient-to-b from-gray-800 to-gray-900 ${
                    plan.recommended ? 'ring-2 ring-blue-500' : ''
                  }`}>
                  <CardContent className="p-6">
                    {plan.recommended && (
                        <motion.div 
                          className="mb-4"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge className="bg-blue-900 text-blue-300">
                          Most Popular
                        </Badge>
                        </motion.div>
                      )}
                      <motion.h3 
                        className="text-lg font-medium text-gray-100"
                        variants={fadeIn}
                      >
                        {plan.name}
                      </motion.h3>
                      <motion.p 
                        className="mt-2 text-sm text-gray-400"
                        variants={fadeIn}
                      >
                        {plan.description}
                      </motion.p>
                      <motion.p 
                        className="mt-4"
                        variants={fadeIn}
                      >
                        <span className="text-4xl font-extrabold text-gray-100">
                        ${plan.price[billingInterval].toFixed(2)}
                      </span>
                      <span className="text-base font-medium text-gray-500">
                        /{billingInterval === "monthly" ? "mo" : "yr"}
                      </span>
                      </motion.p>
                      <motion.ul 
                        className="mt-6 space-y-4"
                        variants={staggerContainer}
                      >
                        {plan.features.map((feature, featureIndex) => (
                          <motion.li 
                            key={feature} 
                            className="flex items-center"
                            variants={fadeIn}
                            custom={featureIndex}
                          >
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="flex-shrink-0 h-5 w-5 text-blue-500" />
                            </motion.div>
                            <span className="ml-3 text-sm text-gray-400">{feature}</span>
                          </motion.li>
                        ))}
                      </motion.ul>
                      <motion.div 
                        className="mt-8"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                      <Button 
                        variant={plan.recommended ? "default" : "outline"} 
                          className={`w-full transition-all duration-300 ${
                            plan.recommended 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-[0_0_15px_rgba(66,153,225,0.3)] hover:shadow-[0_0_25px_rgba(66,153,225,0.5)]' 
                              : 'border-blue-500/20 bg-gray-900/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 backdrop-blur-sm'
                          }`}
                        onClick={handleGetStarted}
                      >
                        {plan.buttonText}
                      </Button>
                      </motion.div>
                  </CardContent>
                </Card>
                </motion.div>
              ))}
            </motion.div>
            </div>

          {/* Background decoration */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_150%,theme(colors.blue.500/10),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-50%,theme(colors.purple.500/10),transparent_70%)]" />
          </motion.div>
        </motion.section>

        {/* Testimonials */}
        <motion.section 
          id="testimonials" 
          className="py-16 bg-gray-800 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              variants={fadeIn}
            >
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500 sm:text-4xl">
                What Our Users Say
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-300">
                Success stories from job seekers who used ResuNext.ai
              </p>
            </motion.div>

            <motion.div 
              className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-8"
              variants={staggerContainer}
            >
              {[
                {
                  content: "ResuNext.ai completely transformed my job search. The AI-powered resume optimization helped me land interviews at top tech companies.",
                  author: {
                    name: "James Davis",
                    role: "Software Engineer",
                    initials: "JD"
                  }
                },
                {
                  content: "The mock interview feature is incredible. It helped me prepare for tough questions and gave me the confidence I needed to succeed.",
                  author: {
                    name: "Sarah Chen",
                    role: "Product Manager",
                    initials: "SC"
                  }
                },
                {
                  content: "Using ResuNext.ai, I was able to tailor my applications perfectly for each role. The AI suggestions were spot-on.",
                  author: {
                    name: "Robert Johnson",
                    role: "Financial Analyst",
                    initials: "RJ"
                  }
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={testimonial.author.name}
                  variants={fadeIn}
                  custom={index}
                  whileHover={{ 
                    y: -10,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card className="h-full bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 * index }}
                      >
                        <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 32 32">
                          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>
                      </motion.div>
                      <motion.p 
                        className="mt-4 text-lg text-gray-300"
                        variants={fadeIn}
                      >
                        {testimonial.content}
                      </motion.p>
                      <motion.div 
                        className="mt-6 flex items-center"
                        variants={fadeIn}
                      >
                    <div className="flex-shrink-0">
                          <motion.div 
                            className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {testimonial.author.initials}
                          </motion.div>
                    </div>
                    <div className="ml-3">
                          <p className="text-sm font-medium text-gray-200">{testimonial.author.name}</p>
                          <p className="text-sm text-gray-400">{testimonial.author.role}</p>
                    </div>
                      </motion.div>
                </CardContent>
              </Card>
                </motion.div>
              ))}
            </motion.div>
                    </div>

          {/* Background decoration */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,theme(colors.blue.500/10),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,theme(colors.purple.500/10),transparent_70%)]" />
          </motion.div>
        </motion.section>

        {/* CTA Section */}
        <motion.section 
          className="py-16 bg-gradient-to-r from-blue-900 to-purple-900 relative overflow-hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              className="text-center"
              variants={fadeIn}
            >
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Ready to Transform Your Job Search?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-blue-200">
                Join thousands of job seekers who've found success with ResuNext.ai
              </p>
              <motion.div 
                className="mt-8 flex justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="px-8 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-[0_0_15px_rgba(66,153,225,0.3)] hover:shadow-[0_0_25px_rgba(66,153,225,0.5)] transition-all duration-300"
                  onClick={handleGetStarted}
                >
                  Get Started for Free
                </Button>
              </motion.div>
            </motion.div>
              </div>

          {/* Background decoration */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_150%,white,transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_-50%,white,transparent_70%)]" />
          </motion.div>
        </motion.section>
      </main>

      {/* Footer */}
      <motion.footer 
        className="bg-gray-900 border-t border-gray-800"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-8"
            variants={staggerContainer}
          >
            <motion.div 
              className="col-span-1"
              variants={fadeIn}
            >
              <motion.div 
                className="flex items-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-blue-500"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    d="M20 6H4V18H20V6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                  />
                  <motion.path
                    d="M4 9H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                  />
                  <motion.path
                    d="M8 9V18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut", delay: 1 }}
                  />
                </svg>
                <span className="ml-2 text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">ResuNext.ai</span>
              </motion.div>
              <p className="mt-2 text-base text-gray-400">
                AI-powered career tools for the modern job seeker.
              </p>
            </motion.div>
            
            {[
              {
                title: "Features",
                links: ["Resume Builder", "Cover Letters", "Interview Prep", "Job Matching"]
              },
              {
                title: "Resources",
                links: ["Blog", "Guides", "Support", "Pricing"]
              },
              {
                title: "Company",
                links: ["About", "Careers", "Privacy", "Terms"]
              }
            ].map((section, index) => (
              <motion.div 
                key={section.title}
                className="col-span-1"
                variants={fadeIn}
                custom={index}
              >
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  {section.title}
                </h3>
              <ul className="mt-4 space-y-4">
                  {section.links.map((link, linkIndex) => (
                    <motion.li 
                      key={link}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <a href="#" className="text-base text-gray-300 hover:text-white transition-colors duration-200">
                        {link}
                      </a>
                    </motion.li>
                  ))}
              </ul>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="mt-8 border-t border-gray-800 pt-8 md:flex md:items-center md:justify-between"
            variants={fadeIn}
          >
            <div className="flex space-x-6 md:order-2">
              {[
                {
                  name: "Twitter",
                  href: "#",
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
                  ),
                },
                {
                  name: "GitHub",
                  href: "#",
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                  ),
                },
                {
                  name: "LinkedIn",
                  href: "#",
                  icon: (props: React.SVGProps<SVGSVGElement>) => (
                    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
                      <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-gray-300"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </motion.a>
              ))}
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0">
              &copy; {new Date().getFullYear()} ResuNext.ai. All rights reserved.
            </p>
          </motion.div>
          </div>
      </motion.footer>
    </div>
  );
}

export default LandingPage;