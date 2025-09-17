"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OnboardingData {
  // Step 1: Base Package Selection
  selectedPackage: string;
  
  // Step 2: Additional Features (Add-ons)
  addOns: string[];
  
  // Step 3: Website Inspiration
  designStyle: string;
  referenceWebsites: string;
  colorScheme: string;
  layoutPreferences: string;
  
  // Step 4: Domain & Hosting
  domainOption: string;
  hostingOption: string;
  
  // Step 5: Maintenance & Support
  maintenancePlan: string;
  
  // Step 6: Account Creation
  email: string;
  password: string;
  confirmPassword: string;
}

// Step 1: Base Package Options
const PACKAGES = [
  {
    id: "business",
    label: "Business Website",
    price: 1199,
    description: "For companies who want an online presence with homepage, about page, services, and contact form."
  },
  {
    id: "portfolio",
    label: "Portfolio / Blog Website",
    price: 999,
    description: "For creatives, professionals, or writers to showcase work or publish articles."
  },
  {
    id: "landing",
    label: "Landing Page (One-pager)",
    price: 699,
    description: "For campaigns, events, or single-purpose marketing."
  },
  {
    id: "booking",
    label: "Booking / Appointment Website",
    price: 1599,
    description: "For service providers to allow online scheduling, calendar sync, and email confirmations."
  },
  {
    id: "ecommerce",
    label: "E-commerce Website",
    price: 2500,
    description: "For selling products online with up to 20 products included."
  },
  {
    id: "custom",
    label: "Fully Coded Custom Website",
    price: 3500,
    description: "Tailored builds with unique UI/UX and advanced integrations.",
    isCustom: true
  },
];

// Step 2: Add-on Options
const ADD_ONS = [
  { id: "contact-form", label: "Contact Form / Extra Forms", price: 50 },
  { id: "photo-gallery", label: "Photo Gallery / Portfolio Grid", price: 75 },
  { id: "booking-advanced", label: "Booking System (advanced features)", price: 150 },
  { id: "ecommerce-expansion", label: "E-commerce Expansion (add 50 products)", price: 150 },
  { id: "multilingual", label: "Multi-language (English + French)", price: 200 },
  { id: "blog-addon", label: "Blog System Add-on (if not included)", price: 100 },
  { id: "custom-ui", label: "Custom UI Design (unique layout & branding)", price: 900 },
  { id: "seo-starter", label: "SEO Starter Pack", price: 200 },
  { id: "analytics", label: "Analytics & Reports", price: 100 },
  { id: "social-integration", label: "Social Media Integration", price: 75 },
];

// Step 3: Design Options
const DESIGN_STYLES = [
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "classic", label: "Classic" },
  { id: "corporate", label: "Corporate" },
  { id: "creative", label: "Creative" },
];

const COLOR_SCHEMES = [
  {
    id: "warm",
    label: "Warm (Reds, Oranges, Yellows)",
    colors: ["#FF6B6B", "#FFA07A", "#FFD700", "#FF8C00", "#FF4500"]
  },
  {
    id: "cool",
    label: "Cool (Blues, Greens, Purples)",
    colors: ["#4682B4", "#20B2AA", "#9370DB", "#6A5ACD", "#48D1CC"]
  },
  {
    id: "neutral",
    label: "Neutral (Grays, Browns, Beiges)",
    colors: ["#808080", "#A9A9A9", "#D3D3D3", "#D2B48C", "#F5F5DC"]
  },
  {
    id: "vibrant",
    label: "Vibrant (Bright, Bold Colors)",
    colors: ["#FF1493", "#00FF7F", "#FFD700", "#FF4500", "#9400D3"]
  },
  {
    id: "minimal",
    label: "Minimal (Black, White, One Accent)",
    colors: ["#000000", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#4169E1"]
  },
];

const LAYOUT_PREFERENCES = [
  { id: "simple", label: "Simple" },
  { id: "multi-section", label: "Multi-section" },
  { id: "grid-based", label: "Grid-based" },
];

// Step 4: Domain & Hosting Options
const DOMAIN_OPTIONS = [
  { id: "none", label: "I already have a domain", price: 0 },
  { id: "com", label: "Register .com domain", price: 12 },
  { id: "ca", label: "Register .ca domain", price: 12 },
];

const HOSTING_OPTIONS = [
  { id: "basic", label: "Basic Hosting (shared)", price: 5, period: "month" },
  { id: "ecommerce", label: "E-commerce Hosting (optimized)", price: 20, period: "month" },
  { id: "custom", label: "Custom Hosting (dedicated)", price: 50, period: "month" },
];

// Step 5: Maintenance Plans
const MAINTENANCE_PLANS = [
  {
    id: "basic",
    label: "Basic Plan",
    price: 75,
    period: "month",
    description: "Includes updates, backups, and security monitoring.",
    hasFreeMonth: true
  },
  {
    id: "growth",
    label: "Growth Plan",
    price: 175,
    period: "month",
    description: "Priority support, updates, and light feature tweaks."
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Load saved data from sessionStorage on component mount
  useEffect(() => {
    const savedData = sessionStorage.getItem('onboardingData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      } catch (err) {
        console.error('Error loading saved onboarding data:', err);
      }
    }
  }, []);
  
  const [formData, setFormData] = useState<OnboardingData>({
    selectedPackage: "",
    addOns: [],
    designStyle: "",
    referenceWebsites: "",
    colorScheme: "",
    layoutPreferences: "",
    domainOption: "",
    hostingOption: "",
    maintenancePlan: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Calculate total cost in real-time
  const [totalCost, setTotalCost] = useState(0);
  
  useEffect(() => {
    calculateTotalCost();
  }, [formData]);

  const calculateTotalCost = () => {
    let cost = 0;
    
    // Base package cost
    if (formData.selectedPackage) {
      const selectedPkg = PACKAGES.find(pkg => pkg.id === formData.selectedPackage);
      if (selectedPkg) {
        cost += selectedPkg.price;
      }
    }
    
    // Add-ons cost
    formData.addOns.forEach(addOnId => {
      const addOn = ADD_ONS.find(addOn => addOn.id === addOnId);
      if (addOn) {
        cost += addOn.price;
      }
    });
    
    // Domain cost
    if (formData.domainOption) {
      const domain = DOMAIN_OPTIONS.find(option => option.id === formData.domainOption);
      if (domain) {
        cost += domain.price;
      }
    }
    
    // Hosting cost (annualized)
    if (formData.hostingOption) {
      const hosting = HOSTING_OPTIONS.find(option => option.id === formData.hostingOption);
      if (hosting) {
        cost += hosting.price * 12; // Annual cost
      }
    }
    
    // Maintenance cost (annualized)
    if (formData.maintenancePlan) {
      const plan = MAINTENANCE_PLANS.find(p => p.id === formData.maintenancePlan);
      if (plan) {
        // First month free for basic plan
        if (plan.id === "basic") {
          cost += plan.price * 11; // 11 months instead of 12
        } else {
          cost += plan.price * 12; // Full year
        }
      }
    }
    
    setTotalCost(cost);
  };

  const handleInputChange = (field: keyof OnboardingData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAddOnToggle = (addOnId: string) => {
    setFormData(prev => {
      const addOns = [...prev.addOns];
      const index = addOns.indexOf(addOnId);
      
      if (index === -1) {
        addOns.push(addOnId);
      } else {
        addOns.splice(index, 1);
      }
      
      return { ...prev, addOns };
    });
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.selectedPackage !== "";
      case 2:
        return true; // Add-ons are optional
      case 3:
        return formData.designStyle !== "" && formData.layoutPreferences !== "";
      case 4:
        return formData.domainOption !== "" && formData.hostingOption !== "";
      case 5:
        return formData.maintenancePlan !== "";
      case 6:
        // Only validate email and password at step 6
        return formData.email.trim() !== "" &&
               formData.password.trim() !== "" &&
               formData.confirmPassword.trim() !== "" &&
               formData.password === formData.confirmPassword;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      setError("Please fill in all required fields");
      return;
    }
    
    if (currentStep < 6) {
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
      // For steps 1-5, allow guest access and save data temporarily
      if (currentStep < 6) {
        // Save data to sessionStorage for guest users
        sessionStorage.setItem('onboardingData', JSON.stringify(formData));
        
        // Move to next step
        setCurrentStep(currentStep + 1);
        return;
      }
      
      // For step 6, check if user is authenticated or needs to sign up
      const token = localStorage.getItem("supabase.auth.token");
      const isAuthenticated = !!token;
      
      if (!isAuthenticated) {
        // User is a guest and needs to create an account
        // Call signup API with form data
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            // Include project data
            projectData: {
              selectedPackage: formData.selectedPackage,
              addOns: formData.addOns,
              designStyle: formData.designStyle,
              referenceWebsites: formData.referenceWebsites,
              colorScheme: formData.colorScheme,
              layoutPreferences: formData.layoutPreferences,
              domainOption: formData.domainOption,
              hostingOption: formData.hostingOption,
              maintenancePlan: formData.maintenancePlan,
            }
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Clear temporary data
          sessionStorage.removeItem('onboardingData');
          
          // Show email verification message
          // This will be implemented in T056
          if (data.requiresEmailVerification) {
            router.push("/login?message=Please check your email to verify your account");
          } else {
            // If email verification is not required, redirect to dashboard
            router.push("/dashboard");
          }
        } else {
          setError(data.message || "An error occurred during account creation");
        }
      } else {
        // User is already authenticated, create project with existing account
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
          // Clear temporary data
          sessionStorage.removeItem('onboardingData');
          
          // Redirect to dashboard after successful onboarding
          router.push("/dashboard");
        } else {
          setError(data.message || "An error occurred during project creation");
        }
      }
    } catch (err) {
      setError("An error occurred during project creation");
      console.error("Onboarding error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const stepTitles = [
      "Package",
      "Features",
      "Design",
      "Domain",
      "Support",
      "Account"
    ];
    
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5, 6].map((step) => (
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
              {step < 6 && (
                <div
                  className={`w-16 h-1 ${
                    step < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {stepTitles.map((title, index) => (
            <div key={index} className="w-16 text-center">
              {title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVerticalStepIndicator = () => {
    const stepTitles = [
      "Package",
      "Features",
      "Design",
      "Domain",
      "Support",
      "Account"
    ];
    
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg mb-4">Project Setup</h3>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            <div>
              <div
                className={`font-medium ${
                  step === currentStep
                    ? "text-primary"
                    : step < currentStep
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {stepTitles[step - 1]}
              </div>
              {step < 6 && (
                <div
                  className={`w-0.5 h-6 ml-3.5 mt-1 ${
                    step < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
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
            <h2 className="text-2xl font-bold">Website Purpose</h2>
            <p className="text-muted-foreground">
              Select the type of website you need. Each includes responsive design, mobile optimization, and SEO-ready structure.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Base Package <span className="text-destructive">*</span>
              </label>
              <div className="space-y-4">
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.selectedPackage === pkg.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("selectedPackage", pkg.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{pkg.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
                      </div>
                      <div className="text-lg font-bold">
                        {pkg.isCustom ? `CAD $${pkg.price}+` : `CAD $${pkg.price}`}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Estimated Total Cost:</span>
                    <span className="text-lg font-bold text-primary">
                      CAD ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Additional Features</h2>
            <p className="text-muted-foreground">
              Select additional features for your website.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Add-ons
              </label>
              <div className="grid grid-cols-1 gap-3">
                {ADD_ONS.map((addOn) => (
                  <div
                    key={addOn.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.addOns.includes(addOn.id)
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleAddOnToggle(addOn.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{addOn.label}</h3>
                      </div>
                      <div className="font-semibold">
                        CAD ${addOn.price}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Estimated Total Cost:</span>
                    <span className="text-lg font-bold text-primary">
                      CAD ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Website Inspiration</h2>
            <p className="text-muted-foreground">
              Tell us about your design preferences.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Design Style <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DESIGN_STYLES.map((style) => (
                  <div
                    key={style.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.designStyle === style.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("designStyle", style.id)}
                  >
                    {style.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="referenceWebsites" className="block text-sm font-medium mb-2">
                Reference Websites
              </label>
              <textarea
                id="referenceWebsites"
                value={formData.referenceWebsites}
                onChange={(e) => handleInputChange("referenceWebsites", e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                placeholder="Paste links to websites you like..."
              />
            </div>
            
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
                    <div className="flex items-center justify-between">
                      <span>{scheme.label}</span>
                      <div className="flex space-x-1">
                        {scheme.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Layout Preferences <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {LAYOUT_PREFERENCES.map((layout) => (
                  <div
                    key={layout.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.layoutPreferences === layout.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("layoutPreferences", layout.id)}
                  >
                    {layout.label}
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Estimated Total Cost:</span>
                    <span className="text-lg font-bold text-primary">
                      CAD ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Domain & Hosting</h2>
            <p className="text-muted-foreground">
              Select your domain and hosting options.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Domain Option <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {DOMAIN_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.domainOption === option.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("domainOption", option.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{option.label}</h3>
                      </div>
                      <div className="font-semibold">
                        {option.price > 0 ? `CAD $${option.price}/year` : "No charge"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Hosting Option <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {HOSTING_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.hostingOption === option.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("hostingOption", option.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{option.label}</h3>
                      </div>
                      <div className="font-semibold">
                        CAD ${option.price}/{option.period}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Estimated Total Cost:</span>
                    <span className="text-lg font-bold text-primary">
                      CAD ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Maintenance & Support</h2>
            <p className="text-muted-foreground">
              Select a maintenance plan for your website.
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Maintenance Plan <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                {MAINTENANCE_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.maintenancePlan === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-input hover:border-primary/50"
                    }`}
                    onClick={() => handleInputChange("maintenancePlan", plan.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{plan.label}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                        {plan.hasFreeMonth && (
                          <p className="text-sm text-green-600 mt-1">First month free!</p>
                        )}
                      </div>
                      <div className="text-lg font-bold">
                        CAD ${plan.price}/{plan.period}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Estimated Total Cost:</span>
                    <span className="text-lg font-bold text-primary">
                      CAD ${totalCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Create Your Account</h2>
            <p className="text-muted-foreground">
              Create your account to finalize your project and access your dashboard.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Sign-up Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Account Information</h3>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="your@email.com"
                    required
                    aria-required="true"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Create a password"
                    required
                    aria-required="true"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                    aria-required="true"
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                  <p className="text-sm text-blue-800">
                    After creating your account, you&apos;ll receive a confirmation email.
                    Once verified, your project will be created and you can access your dashboard.
                    Our team will review your project, confirm the details, and notify you when payment is required.
                    After payment, development will begin on your website.
                  </p>
                </div>
              </div>
              
              {/* Right Column: Project Summary */}
              <div className="bg-muted rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                
                <div className="space-y-4">
                  {/* Selected Package */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Selected Package</h4>
                    {formData.selectedPackage ? (
                      <div className="flex justify-between items-center">
                        <p className="font-medium">
                          {PACKAGES.find(pkg => pkg.id === formData.selectedPackage)?.label}
                        </p>
                        <p className="font-semibold">
                          CAD ${PACKAGES.find(pkg => pkg.id === formData.selectedPackage)?.price.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No package selected</p>
                    )}
                  </div>
                  
                  {/* Add-ons */}
                  {formData.addOns.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Add-ons</h4>
                      <div className="space-y-2">
                        {formData.addOns.map(addOnId => {
                          const addOn = ADD_ONS.find(addOn => addOn.id === addOnId);
                          return addOn ? (
                            <div key={addOnId} className="flex justify-between items-center">
                              <p className="text-sm">{addOn.label}</p>
                              <p className="font-semibold text-sm">
                                CAD ${addOn.price.toLocaleString()}
                              </p>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Domain */}
                  {formData.domainOption && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Domain</h4>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">
                          {DOMAIN_OPTIONS.find(option => option.id === formData.domainOption)?.label}
                        </p>
                        <p className="font-semibold text-sm">
                          {DOMAIN_OPTIONS.find(option => option.id === formData.domainOption)?.price ?? 0 > 0 
                            ? `CAD ${(DOMAIN_OPTIONS.find(option => option.id === formData.domainOption)?.price ?? 0).toLocaleString()}` 
                            : 'No charge'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Hosting */}
                  {formData.hostingOption && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Hosting</h4>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">
                          {HOSTING_OPTIONS.find(option => option.id === formData.hostingOption)?.label}
                        </p>
                        <p className="font-semibold text-sm">
                          CAD ${((HOSTING_OPTIONS.find(option => option.id === formData.hostingOption)?.price ?? 0) * 12).toLocaleString()}/year
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Maintenance Plan */}
                  {formData.maintenancePlan && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Maintenance Plan</h4>
                      <div className="flex justify-between items-center">
                        <p className="text-sm">
                          {MAINTENANCE_PLANS.find(plan => plan.id === formData.maintenancePlan)?.label}
                        </p>
                        <p className="font-semibold text-sm">
                          CAD ${MAINTENANCE_PLANS.find(plan => plan.id === formData.maintenancePlan)?.price.toLocaleString()}/month
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Total Cost */}
                  <div className="pt-3 mt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Cost</span>
                      <span className="text-xl font-bold text-primary">
                        CAD ${totalCost.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Includes one-time and annual costs
                    </p>
                  </div>
                </div>
              </div>
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
        <div className="w-full max-w-4xl bg-background rounded-lg border">
          <div className="p-8 border-b">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Create Your Project</h1>
              <p className="text-muted-foreground">
                Follow these steps to set up your website project
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Vertical Step Indicator for Desktop */}
            <div className="md:w-1/4 p-6 border-r hidden md:block">
              {renderVerticalStepIndicator()}
            </div>

            {/* Main Content */}
            <div className="md:w-3/4 p-6">
              {/* Real-time Cost Calculator */}
              <div className="mb-6 p-4 bg-primary/5 rounded-md border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Estimated Total Cost:</span>
                  <span className="text-xl font-bold text-primary">
                    CAD ${totalCost.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All prices are in CAD and include one-time and annual costs
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
                  {error}
                </div>
              )}

              {/* Horizontal Step Indicator for Mobile */}
              <div className="md:hidden mb-6">
                {renderStepIndicator()}
              </div>

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
                    : currentStep === 6
                    ? "Create Project"
                    : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}