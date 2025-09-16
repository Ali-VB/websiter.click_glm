"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OnboardingData {
  projectName: string;
  projectDescription: string;
  businessType: string;
  targetAudience: string;
  features: string[];
  colorScheme: string;
  logoUrl: string;
  additionalNotes: string;
}

const BUSINESS_TYPES = [
  { id: "restaurant", label: "Restaurant" },
  { id: "retail", label: "Retail" },
  { id: "service", label: "Service" },
  { id: "professional", label: "Professional" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "other", label: "Other" },
];

const FEATURES = [
  { id: "menu", label: "Menu" },
  { id: "gallery", label: "Photo Gallery" },
  { id: "contact form", label: "Contact Form" },
  { id: "booking", label: "Booking System" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "blog", label: "Blog" },
  { id: "map", label: "Map/Location" },
  { id: "reviews", label: "Customer Reviews" },
];

const COLOR_SCHEMES = [
  { id: "warm", label: "Warm (Reds, Oranges, Yellows)" },
  { id: "cool", label: "Cool (Blues, Greens, Purples)" },
  { id: "neutral", label: "Neutral (Grays, Browns, Beiges)" },
  { id: "vibrant", label: "Vibrant (Bright, Bold Colors)" },
  { id: "minimal", label: "Minimal (Black, White, One Accent)" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState<OnboardingData>({
    projectName: "",
    projectDescription: "",
    businessType: "",
    targetAudience: "",
    features: [],
    colorScheme: "",
    logoUrl: "",
    additionalNotes: "",
  });

  const handleInputChange = (field: keyof OnboardingData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => {
      const features = [...prev.features];
      const index = features.indexOf(featureId);
      
      if (index === -1) {
        features.push(featureId);
      } else {
        features.splice(index, 1);
      }
      
      return { ...prev, features };
    });
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.projectName.trim() !== "" && 
               formData.projectDescription.trim() !== "" && 
               formData.businessType !== "";
      case 2:
        return formData.targetAudience.trim() !== "";
      case 3:
        return true; // Features are optional
      case 4:
        return true; // Color scheme is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError("");
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to create a project");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to dashboard after successful onboarding
        router.push("/dashboard");
      } else {
        setError(data.message || "An error occurred during project creation");
      }
    } catch (err) {
      setError("An error occurred during project creation");
      console.error("Onboarding error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 ${
                  step < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Project Basics</h2>
            <p className="text-muted-foreground">
              Tell us about your project and business type.
            </p>
            
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium mb-2">
                Project Name <span className="text-destructive">*</span>
              </label>
              <input
                id="projectName"
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange("projectName", e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="My Awesome Website"
                required
                aria-required="true"
              />
            </div>
            
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium mb-2">
                Project Description <span className="text-destructive">*</span>
              </label>
              <textarea
                id="projectDescription"
                value={formData.projectDescription}
                onChange={(e) => handleInputChange("projectDescription", e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                placeholder="Describe your website project..."
                required
                aria-required="true"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Business Type <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.businessType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("businessType", type.id)}
                  >
                    {type.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Target Audience</h2>
            <p className="text-muted-foreground">
              Who is your website primarily for?
            </p>
            
            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium mb-2">
                Target Audience <span className="text-destructive">*</span>
              </label>
              <textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                placeholder="Describe your target audience..."
                required
                aria-required="true"
              />
            </div>
            
            <div>
              <label htmlFor="additionalNotes" className="block text-sm font-medium mb-2">
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                placeholder="Any additional requirements or notes..."
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Features</h2>
            <p className="text-muted-foreground">
              Select the features you need for your website.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Website Features
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FEATURES.map((feature) => (
                  <div
                    key={feature.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.features.includes(feature.id)
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleFeatureToggle(feature.id)}
                  >
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Design Preferences</h2>
            <p className="text-muted-foreground">
              Tell us about your design preferences.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Color Scheme
              </label>
              <div className="grid grid-cols-1 gap-3">
                {COLOR_SCHEMES.map((scheme) => (
                  <div
                    key={scheme.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.colorScheme === scheme.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("colorScheme", scheme.id)}
                  >
                    {scheme.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="logoUrl" className="block text-sm font-medium mb-2">
                Logo URL
              </label>
              <input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full"></div>
          <span className="font-bold text-xl">websiter.click</span>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </header>

      {/* Onboarding Form */}
      <section className="container mx-auto px-4 py-8 flex justify-center">
        <div className="w-full max-w-2xl bg-background p-8 rounded-lg border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Project</h1>
            <p className="text-muted-foreground">
              Follow these steps to set up your website project
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {renderStepIndicator()}
          {renderStepContent()}

          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading
                ? "Creating Project..."
                : currentStep === 4
                ? "Create Project"
                : "Next"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}