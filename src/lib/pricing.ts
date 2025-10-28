// Comprehensive pricing configuration for website packages and services
// All prices are in CAD

export interface CostBreakdown {
  development: {
    basePackage: number;
    addOns: number;
    subtotal: number;
  };
  annual: {
    domain: number;
    hosting: number;
    maintenance: number;
    addOnsAnnual: number;
    subtotal: number;
  };
  total: {
    oneTime: number;
    annual: number;
    firstYear: number;
    monthlyAverage: number;
  };
}

export interface PackageInfo {
  id: string;
  label: string;
  price: number;
  description: string;
}

export interface AddOnInfo {
  id: string;
  label: string;
  price: number;
  isAnnual?: boolean;
  description: string;
}

export interface DomainInfo {
  id: string;
  label: string;
  price: number;
  period: 'year';
  description: string;
}

export interface HostingInfo {
  id: string;
  label: string;
  price: number;
  period: 'month';
  description: string;
}

export interface MaintenanceInfo {
  id: string;
  label: string;
  price: number;
  period: 'month';
  description: string;
  hasFreeMonth?: boolean;
}

// Website Packages (One-time development costs)
export const WEBSITE_PACKAGES: PackageInfo[] = [
  { 
    id: "business", 
    label: "Business Website", 
    price: 1199,
    description: "Professional business website with all essential features"
  },
  { 
    id: "portfolio", 
    label: "Portfolio / Blog Website", 
    price: 999,
    description: "Beautiful portfolio or blog with gallery and content management"
  },
  { 
    id: "landing", 
    label: "Landing Page (One-pager)", 
    price: 699,
    description: "Single-page landing site optimized for conversions"
  },
  { 
    id: "booking", 
    label: "Booking / Appointment Website", 
    price: 1599,
    description: "Booking system with calendar and appointment management"
  },
  { 
    id: "ecommerce", 
    label: "E-commerce Website", 
    price: 2500,
    description: "Full e-commerce platform with payment processing"
  },
  { 
    id: "custom", 
    label: "Fully Coded Custom Website", 
    price: 3500,
    description: "Completely custom website with advanced features"
  },
];

// Add-ons (Some one-time, some annual)
export const ADD_ONS: AddOnInfo[] = [
  { 
    id: "contact-form", 
    label: "Contact Form / Extra Forms", 
    price: 50,
    description: "Additional contact forms or custom form fields"
  },
  { 
    id: "photo-gallery", 
    label: "Photo Gallery / Portfolio Grid", 
    price: 75,
    description: "Image gallery with lightbox and organization features"
  },
  { 
    id: "booking-advanced", 
    label: "Booking System (advanced features)", 
    price: 150,
    description: "Advanced booking features with notifications"
  },
  { 
    id: "ecommerce-expansion", 
    label: "E-commerce Expansion (add 50 products)", 
    price: 150,
    isAnnual: true,
    description: "Expand e-commerce capacity by 50 products"
  },
  { 
    id: "multilingual", 
    label: "Multi-language (English + French)", 
    price: 200,
    isAnnual: true,
    description: "Multi-language support with translation management"
  },
  { 
    id: "blog-addon", 
    label: "Blog System Add-on (if not included)", 
    price: 100,
    description: "Full blog system with categories and comments"
  },
  { 
    id: "custom-ui", 
    label: "Custom UI Design (unique layout & branding)", 
    price: 900,
    description: "Custom designed user interface and branding"
  },
  { 
    id: "seo-starter", 
    label: "SEO Starter Pack", 
    price: 200,
    isAnnual: true,
    description: "Basic SEO optimization and setup"
  },
  { 
    id: "analytics", 
    label: "Analytics & Reports", 
    price: 100,
    isAnnual: true,
    description: "Google Analytics setup and monthly reports"
  },
  { 
    id: "social-integration", 
    label: "Social Media Integration", 
    price: 75,
    description: "Social media feeds and sharing buttons"
  },
];

// Domain Registration (Annual costs)
export const DOMAIN_OPTIONS: DomainInfo[] = [
  { 
    id: "none", 
    label: "I already have a domain", 
    price: 0,
    period: 'year',
    description: "Client will use existing domain"
  },
  { 
    id: "com", 
    label: "Register .com domain", 
    price: 12,
    period: 'year',
    description: "New .com domain registration"
  },
  { 
    id: "ca", 
    label: "Register .ca domain", 
    price: 12,
    period: 'year',
    description: "New .ca domain registration"
  },
  { 
    id: "org", 
    label: "Register .org domain", 
    price: 15,
    period: 'year',
    description: "New .org domain registration"
  },
  { 
    id: "net", 
    label: "Register .net domain", 
    price: 13,
    period: 'year',
    description: "New .net domain registration"
  },
];

// Hosting Options (Monthly costs, annualized for calculations)
export const HOSTING_OPTIONS: HostingInfo[] = [
  { 
    id: "basic", 
    label: "Basic Hosting (shared)", 
    price: 5,
    period: 'month',
    description: "Shared hosting suitable for small websites"
  },
  { 
    id: "standard", 
    label: "Standard Hosting (shared)", 
    price: 10,
    period: 'month',
    description: "Enhanced shared hosting with better performance"
  },
  { 
    id: "ecommerce", 
    label: "E-commerce Hosting (optimized)", 
    price: 20,
    period: 'month',
    description: "Optimized hosting for e-commerce websites"
  },
  { 
    id: "vps", 
    label: "VPS Hosting", 
    price: 35,
    period: 'month',
    description: "Virtual Private Server for better control"
  },
  { 
    id: "custom", 
    label: "Custom Hosting (dedicated)", 
    price: 50,
    period: 'month',
    description: "Dedicated server for maximum performance"
  },
];

// Maintenance Plans (Monthly costs, annualized for calculations)
export const MAINTENANCE_PLANS: MaintenanceInfo[] = [
  {
    id: "none",
    label: "No Maintenance",
    price: 0,
    period: 'month',
    description: "No ongoing maintenance support. Pay-as-you-go for any needed help."
  },
  {
    id: "basic",
    label: "Basic Plan",
    price: 75,
    period: 'month',
    description: "Essential security and maintenance for peace of mind. 2 months free trial!",
    hasFreeMonth: true
  },
  {
    id: "plus",
    label: "Plus Plan",
    price: 125,
    period: 'month',
    description: "Basic maintenance plus 1 hour of content updates monthly. 2 months free trial!",
    hasFreeMonth: true
  },
  {
    id: "payg",
    label: "Pay-As-You-Go",
    price: 0,
    period: 'month',
    description: "No monthly fee. Pay $40/hour only when you need help. 15-minute increments, $10 minimum."
  },
  {
    id: "custom",
    label: "Custom Plan",
    price: 0,
    period: 'month',
    description: "Custom solutions - contact us for pricing"
  }
];

// Pay-As-You-Go Pricing Configuration
export const PAYG_PRICING = {
  hourlyRate: 40, // $40 per hour
  minimumCharge: 10, // $10 minimum charge
  incrementMinutes: 15, // Bill in 15-minute increments
  incrementHours: 0.25 // 15 minutes in decimal hours
};

// Maintenance Plan Configuration
export const MAINTENANCE_CONFIG = {
  trialMonths: 2, // 2 months free trial for paid plans
  plusPlanContentHours: 1, // 1 hour content updates per month for Plus plan
  billingDay: 1, // Day of month for billing
  gracePeriodDays: 7 // Grace period for missed payments
};

// Tax rates by region
export const TAX_RATES = {
  'US': 0.08, // 8% default
  'EU': 0.20, // 20% VAT
  'UK': 0.20, // 20% VAT
  'CA': 0.13, // 13% HST (Ontario)
  'ON': 0.13, // 13% HST Ontario
  'NONE': 0.00 // No tax
};

/**
 * Calculate comprehensive cost breakdown for a website project
 * @param websiteType - Type of website package
 * @param addOns - Array of selected add-on IDs
 * @param domainOption - Selected domain option ID
 * @param hostingOption - Selected hosting option ID
 * @param maintenancePlan - Selected maintenance plan ID
 * @returns Complete cost breakdown
 */
export function calculateProjectCosts({
  websiteType,
  addOns = [],
  domainOption = 'none',
  hostingOption = 'basic',
  maintenancePlan = 'none'
}: {
  websiteType: string;
  addOns?: string[];
  domainOption?: string;
  hostingOption?: string;
  maintenancePlan?: string;
}): CostBreakdown {
  // Initialize costs
  const costs: CostBreakdown = {
    development: {
      basePackage: 0,
      addOns: 0,
      subtotal: 0
    },
    annual: {
      domain: 0,
      hosting: 0,
      maintenance: 0,
      addOnsAnnual: 0,
      subtotal: 0
    },
    total: {
      oneTime: 0,
      annual: 0,
      firstYear: 0,
      monthlyAverage: 0
    }
  };

  // Base package cost (one-time development)
  const packageInfo = getPackageInfo(websiteType);
  if (packageInfo) {
    costs.development.basePackage = packageInfo.price;
  }

  // Add-ons costs
  addOns.forEach(addOnIdOrLabel => {
    const addOnInfo = getAddOnInfo(addOnIdOrLabel);
    if (addOnInfo) {
      if (addOnInfo.isAnnual) {
        costs.annual.addOnsAnnual += addOnInfo.price;
      } else {
        costs.development.addOns += addOnInfo.price;
      }
    }
  });

  // Domain cost (annual)
  const domainInfo = getDomainInfo(domainOption);
  if (domainInfo) {
    costs.annual.domain = domainInfo.price;
  }

  // Hosting cost (annualized)
  const hostingInfo = getHostingInfo(hostingOption);
  if (hostingInfo) {
    costs.annual.hosting = hostingInfo.price * 12;
  }

  // Maintenance cost (annualized)
  const maintenanceInfo = getMaintenanceInfo(maintenancePlan);
  if (maintenanceInfo) {
    const months = maintenanceInfo.hasFreeMonth ? 11 : 12;
    costs.annual.maintenance = maintenanceInfo.price * months;
  }

  // Calculate subtotals
  costs.development.subtotal = costs.development.basePackage + costs.development.addOns;
  costs.annual.subtotal = costs.annual.domain + costs.annual.hosting + costs.annual.maintenance + costs.annual.addOnsAnnual;

  // Calculate totals
  costs.total.oneTime = costs.development.subtotal;
  costs.total.annual = costs.annual.subtotal;
  costs.total.firstYear = costs.total.oneTime + costs.total.annual;
  costs.total.monthlyAverage = costs.total.firstYear / 12;

  return costs;
}

/**
 * Format currency amount in CAD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

/**
 * Get package info by ID
 */
export function getPackageInfo(idOrLabel: string): PackageInfo | undefined {
  return WEBSITE_PACKAGES.find(pkg => pkg.id === idOrLabel || pkg.label === idOrLabel);
}

/**
 * Get add-on info by ID or Label
 */
export function getAddOnInfo(idOrLabel: string): AddOnInfo | undefined {
  return ADD_ONS.find(addon => addon.id === idOrLabel || addon.label === idOrLabel);
}

/**
 * Get domain info by ID or Label
 */
export function getDomainInfo(idOrLabel: string): DomainInfo | undefined {
  return DOMAIN_OPTIONS.find(domain => domain.id === idOrLabel || domain.label.includes(idOrLabel));
}

/**
 * Get hosting info by ID or Label
 */
export function getHostingInfo(idOrLabel: string): HostingInfo | undefined {
  return HOSTING_OPTIONS.find(hosting => hosting.id === idOrLabel || hosting.label.includes(idOrLabel));
}

/**
 * Get maintenance info by ID or Label
 */
export function getMaintenanceInfo(idOrLabel: string): MaintenanceInfo | undefined {
  return MAINTENANCE_PLANS.find(plan => plan.id === idOrLabel || plan.label.includes(idOrLabel));
}

/**
 * Calculate pay-as-you-go cost based on time worked
 * @param hours - Hours worked (decimal, e.g., 1.5 for 1 hour 30 minutes)
 * @returns Calculated cost in CAD
 */
export function calculatePAYGCost(hours: number): number {
  if (hours <= 0) return 0;
  
  // Calculate cost based on hourly rate
  let cost = hours * PAYG_PRICING.hourlyRate;
  
  // Apply minimum charge
  if (cost < PAYG_PRICING.minimumCharge && hours > 0) {
    cost = PAYG_PRICING.minimumCharge;
  }
  
  return Math.round(cost * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate billable hours (rounded to 15-minute increments)
 * @param actualHours - Actual hours worked
 * @returns Billable hours rounded to increments
 */
export function calculateBillableHours(actualHours: number): number {
  if (actualHours <= 0) return 0;
  
  // Round up to nearest 15-minute increment
  const increments = Math.ceil(actualHours / PAYG_PRICING.incrementHours);
  return increments * PAYG_PRICING.incrementHours;
}

/**
 * Generate time estimate range for a task
 * @param minHours - Minimum estimated hours
 * @param maxHours - Maximum estimated hours
 * @returns Formatted estimate string
 */
export function generateTimeEstimate(minHours: number, maxHours: number): string {
  const minCost = calculatePAYGCost(calculateBillableHours(minHours));
  const maxCost = calculatePAYGCost(calculateBillableHours(maxHours));
  
  return `${minHours}-${maxHours} hours, ${formatCurrency(minCost)}-${formatCurrency(maxCost)}`;
}

/**
 * Check if a maintenance plan has trial period
 * @param planId - Maintenance plan ID
 * @returns True if plan has trial period
 */
export function hasTrialPeriod(planId: string): boolean {
  const plan = getMaintenanceInfo(planId);
  return plan?.hasFreeMonth || false;
}

/**
 * Calculate maintenance billing amount for a month
 * @param planId - Maintenance plan ID
 * @param isInTrial - Whether client is in trial period
 * @returns Monthly billing amount
 */
export function calculateMaintenanceBilling(planId: string, isInTrial: boolean = false): number {
  if (isInTrial) return 0;
  
  const plan = getMaintenanceInfo(planId);
  return plan?.price || 0;
}

/**
 * Determine if work is covered by maintenance plan
 * @param maintenancePlan - Client's maintenance plan
 * @param workType - Type of work ('emergency', 'content', 'development')
 * @returns True if work is covered by plan
 */
export function isWorkCoveredByPlan(maintenancePlan: string, workType: string): boolean {
  switch (maintenancePlan) {
    case 'basic':
      return workType === 'emergency';
    case 'plus':
      return workType === 'emergency' || workType === 'content';
    case 'payg':
    case 'none':
    case 'custom':
      return false;
    default:
      return false;
  }
}
