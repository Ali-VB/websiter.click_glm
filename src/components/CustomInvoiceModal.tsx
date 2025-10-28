"use client";

import { useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { 
  calculateProjectCosts, 
  formatCurrency, 
  getPackageInfo, 
  getAddOnInfo, 
  getDomainInfo, 
  getHostingInfo, 
  getMaintenanceInfo,
  PAYG_PRICING,
  calculatePAYGCost,
  TAX_RATES
} from "@/lib/pricing";

export interface InvoiceData {
  ownerName: string;
  ownerEmail: string;
  ownerCompany: string;
  ownerAddress: string;
  projectName: string;
  duration: string;
  startDate: string;
  endDate: string;
  basePrice: number;
  addonsPrice: number;
  taxRate: number;
  paymentTerms: string;
  dueDate: string;
  invoiceType: 'development' | 'maintenance' | 'payg';
}

interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  status: string;
  type: "business" | "portfolio" | "landing" | "booking" | "ecommerce" | "custom";
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  progressPercentage: number;
  lastActivityAt: string;
  isApproved: boolean;
  requirements: {
    basePackage: string;
    addons: string[];
    designStyle: string;
    referenceWebsites: string;
    colorScheme: string;
    layoutPreference: string;
    domain: string;
    hosting: string;
    maintenance: string;
  };
  domain_info?: {
    domainOption?: string;
    hostingOption?: string;
  };
}

interface CustomInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: InvoiceData;
  setInvoiceData: (data: InvoiceData) => void;
  project: Project;
  onCreateInvoice: () => void;
  isLoading: boolean;
}

export default function CustomInvoiceModal({
  isOpen,
  onClose,
  invoiceData,
  setInvoiceData,
  project,
  onCreateInvoice,
  isLoading
}: CustomInvoiceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-calculate pricing based on project requirements using the new pricing system
  const calculatedPricing = useMemo(() => {
    // DEBUG: Log project data to understand the structure
    console.log('=== DEBUG: Project Data ===');
    console.log('Project Type:', project.type);
    console.log('Project Requirements:', project.requirements);
    console.log('Domain Info:', project.domain_info);
    console.log('Add-ons array:', project.requirements.addons);
    console.log('Domain from domain_info:', project.domain_info?.domainOption);
    console.log('Hosting from domain_info:', project.domain_info?.hostingOption);
    console.log('Maintenance:', project.requirements.maintenance);
    
    // DEBUG: Check if add-ons are being found in pricing config
    if (project.requirements.addons && project.requirements.addons.length > 0) {
      console.log('=== DEBUG: Add-on Lookup ===');
      project.requirements.addons.forEach((addon, index) => {
        const addOnInfo = getAddOnInfo(addon);
        console.log(`Add-on ${index}: "${addon}" ->`, addOnInfo);
      });
    }
    
    // DEBUG: Check domain/hosting/maintenance lookup
    console.log('=== DEBUG: Domain/Hosting/Maintenance Lookup ===');
    console.log(`Domain "${project.domain_info?.domainOption}" ->`, getDomainInfo(project.domain_info?.domainOption || 'none'));
    console.log(`Hosting "${project.domain_info?.hostingOption}" ->`, getHostingInfo(project.domain_info?.hostingOption || 'basic'));
    console.log(`Maintenance "${project.requirements.maintenance}" ->`, getMaintenanceInfo(project.requirements.maintenance || 'none'));
    
    // Calculate comprehensive costs using the unified pricing system
    const costs = calculateProjectCosts({
      websiteType: project.type,
      addOns: project.requirements.addons,
      domainOption: project.domain_info?.domainOption || project.requirements?.domain || 'none',
      hostingOption: project.domain_info?.hostingOption || project.requirements?.hosting || 'basic',
      maintenancePlan: project.requirements.maintenance || 'none'
    });

    // DEBUG: Log calculated costs
    console.log('=== DEBUG: Calculated Costs ===');
    console.log('Development Base Package:', costs.development.basePackage);
    console.log('Development Add-ons:', costs.development.addOns);
    console.log('Annual Domain:', costs.annual.domain);
    console.log('Annual Hosting:', costs.annual.hosting);
    console.log('Annual Maintenance:', costs.annual.maintenance);
    console.log('Total Annual:', costs.total.annual);
    console.log('Total First Year:', costs.total.firstYear);

    return {
      basePrice: costs.development.basePackage,
      addonsPrice: costs.development.addOns,
      totalBasePrice: costs.development.basePackage,
      totalAddonsPrice: costs.development.addOns,
      annualCosts: costs.total.annual,
      firstYearTotal: costs.total.firstYear
    };
  }, [project.type, project.requirements.addons, project.domain_info?.domainOption, project.domain_info?.hostingOption, project.requirements.maintenance]);

  // Initialize invoice data with calculated pricing when modal opens
  useEffect(() => {
    if (isOpen) {
      // Only update if values are different to prevent infinite loop
      const currentBasePrice = invoiceData.basePrice;
      const currentAddonsPrice = invoiceData.addonsPrice;
      const currentProjectName = invoiceData.projectName;
      const currentOwnerName = invoiceData.ownerName;
      const currentOwnerEmail = invoiceData.ownerEmail;

      const needsUpdate = 
        currentBasePrice !== calculatedPricing.basePrice ||
        currentAddonsPrice !== calculatedPricing.addonsPrice ||
        currentProjectName !== (project.name || '') ||
        currentOwnerName !== (project.clientName || '') ||
        currentOwnerEmail !== (project.clientEmail || '');

      if (needsUpdate) {
        setInvoiceData({
          ...invoiceData,
          basePrice: calculatedPricing.basePrice,
          addonsPrice: calculatedPricing.addonsPrice,
          projectName: project.name || invoiceData.projectName,
          ownerName: project.clientName || invoiceData.ownerName,
          ownerEmail: project.clientEmail || invoiceData.ownerEmail
        });
      }
    }
  }, [isOpen, calculatedPricing.basePrice, calculatedPricing.addonsPrice, project.name, project.clientName, project.clientEmail, setInvoiceData, invoiceData]);

  // Calculate totals with real-time updates
  const subtotal = invoiceData.basePrice + invoiceData.addonsPrice;
  const taxAmount = Math.round(subtotal * invoiceData.taxRate * 100) / 100; // Proper decimal rounding
  const totalAmount = subtotal + taxAmount;

  // Validate form data
  const formErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    
    if (!invoiceData.ownerName.trim()) {
      errors.ownerName = "Client name is required";
    }
    
    if (!invoiceData.ownerEmail.trim()) {
      errors.ownerEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceData.ownerEmail)) {
      errors.ownerEmail = "Invalid email format";
    }
    
    if (!invoiceData.projectName.trim()) {
      errors.projectName = "Project name is required";
    }
    
    if (invoiceData.basePrice < 0) {
      errors.basePrice = "Base price must be positive";
    }
    
    if (invoiceData.addonsPrice < 0) {
      errors.addonsPrice = "Add-ons price must be positive";
    }
    
    if (invoiceData.taxRate < 0 || invoiceData.taxRate > 1) {
      errors.taxRate = "Tax rate must be between 0 and 100%";
    }
    
    return errors;
  }, [invoiceData]);

  const hasErrors = Object.keys(formErrors).length > 0;

  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="w-[95vw] max-w-7xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold">📄 Create Professional Invoice</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Client Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  👤 Client Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Client Name</Label>
                    <Input
                      value={invoiceData.ownerName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, ownerName: e.target.value })}
                      className={`mt-1 h-10 ${formErrors.ownerName ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter client name"
                    />
                    {formErrors.ownerName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.ownerName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Email</Label>
                    <Input
                      type="email"
                      value={invoiceData.ownerEmail}
                      onChange={(e) => setInvoiceData({ ...invoiceData, ownerEmail: e.target.value })}
                      className={`mt-1 h-10 ${formErrors.ownerEmail ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="client@example.com"
                    />
                    {formErrors.ownerEmail && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.ownerEmail}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Company</Label>
                    <Input
                      value={invoiceData.ownerCompany}
                      onChange={(e) => setInvoiceData({ ...invoiceData, ownerCompany: e.target.value })}
                      className="mt-1 h-10"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Address</Label>
                    <Input
                      value={invoiceData.ownerAddress}
                      onChange={(e) => setInvoiceData({ ...invoiceData, ownerAddress: e.target.value })}
                      className="mt-1 h-10"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🚀 Project Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-green-700 dark:text-green-300">Project Name</Label>
                    <Input
                      value={invoiceData.projectName}
                      onChange={(e) => setInvoiceData({ ...invoiceData, projectName: e.target.value })}
                      className={`mt-1 h-10 ${formErrors.projectName ? 'border-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter project name"
                    />
                    {formErrors.projectName && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.projectName}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700 dark:text-green-300">Website Type</Label>
                    <Input
                      value={project.type}
                      disabled
                      className="mt-1 h-10 bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700 dark:text-green-300">Start Date</Label>
                    <Input
                      type="date"
                      value={invoiceData.startDate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, startDate: e.target.value })}
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700 dark:text-green-300">End Date</Label>
                    <Input
                      type="date"
                      value={invoiceData.endDate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, endDate: e.target.value })}
                      className="mt-1 h-10"
                    />
                  </div>
                </div>

                {/* Project Requirements Summary */}
                <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Project Requirements:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div>• <strong>Design Style:</strong> {project.requirements.designStyle}</div>
                    <div>• <strong>Color Scheme:</strong> {project.requirements.colorScheme}</div>
                    <div>• <strong>Add-ons:</strong> {project.requirements.addons.join(', ') || 'None'}</div>
                    <div>• <strong>Domain:</strong> {project.requirements.domain}</div>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  💰 Pricing Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Base Package ($)</Label>
                    <Input
                      type="number"
                      value={invoiceData.basePrice}
                      onChange={(e) => setInvoiceData({ ...invoiceData, basePrice: parseInt(e.target.value) || 0 })}
                      className={`mt-1 h-10 ${formErrors.basePrice ? 'border-red-500 focus:border-red-500' : ''}`}
                      min="0"
                      placeholder="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">Standard website package</p>
                    {formErrors.basePrice && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.basePrice}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Add-ons ($)</Label>
                    <Input
                      type="number"
                      value={invoiceData.addonsPrice}
                      onChange={(e) => setInvoiceData({ ...invoiceData, addonsPrice: parseInt(e.target.value) || 0 })}
                      className={`mt-1 h-10 ${formErrors.addonsPrice ? 'border-red-500 focus:border-red-500' : ''}`}
                      min="0"
                      placeholder="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">Additional features</p>
                    {formErrors.addonsPrice && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.addonsPrice}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-purple-700 dark:text-purple-300">Tax Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={invoiceData.taxRate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })}
                      className={`mt-1 h-10 ${formErrors.taxRate ? 'border-red-500 focus:border-red-500' : ''}`}
                      min="0"
                      max="1"
                      placeholder="0.08"
                    />
                    <p className="text-sm text-gray-500 mt-1">Decimal (0.08 = 8%)</p>
                    {formErrors.taxRate && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.taxRate}</p>
                    )}
                  </div>
                </div>

                {/* Add-ons Breakdown */}
                {project.requirements.addons.length > 0 && (
                  <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <h4 className="font-medium text-sm mb-3">Selected Add-ons:</h4>
                    <div className="space-y-2">
                      {project.requirements.addons.map((addon, index) => {
                        const addOnInfo = getAddOnInfo(addon);
                        console.log(`DEBUG: Add-on ${index}:`, addon, 'Info:', addOnInfo);
                        return (
                          <div key={index} className="flex justify-between text-sm">
                            <span>• {addOnInfo?.label || addon}</span>
                            <span className="text-gray-500">{addOnInfo ? formatCurrency(addOnInfo.price) : '$250'}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Add-ons Total:</span>
                        <span>{formatCurrency(calculatedPricing.addonsPrice)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary & Settings (1/3 width) */}
            <div className="space-y-6">
              {/* Simplified Cost Breakdown */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📊 Invoice Summary
                </h3>
                
                {/* Development Costs (This Invoice) */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Development Costs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Base Package:</span>
                      <span className="font-semibold text-sm">{formatCurrency(calculatedPricing.basePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Add-ons:</span>
                      <span className="font-semibold text-sm">{formatCurrency(calculatedPricing.addonsPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Subtotal:</span>
                      <span className="font-semibold text-sm">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Tax ({(invoiceData.taxRate * 100).toFixed(0)}%):</span>
                      <span className="font-semibold text-sm">{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-lg px-3">
                      <span className="text-sm font-bold">Total Due:</span>
                      <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Annual Costs (Future) */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Annual Recurring Costs</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Domain:</span>
                      <span className="font-semibold text-sm">{formatCurrency(getDomainInfo(project.domain_info?.domainOption || project.requirements?.domain || 'none')?.price || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Hosting:</span>
                      <span className="font-semibold text-sm">{formatCurrency((getHostingInfo(project.domain_info?.hostingOption || project.requirements?.hosting || 'basic')?.price || 0) * 12)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm">Maintenance:</span>
                      <span className="font-semibold text-sm">
                        {formatCurrency(
                          (getMaintenanceInfo(project.requirements.maintenance || 'none')?.price || 0) * 
                          (getMaintenanceInfo(project.requirements.maintenance || 'none')?.hasFreeMonth ? 11 : 12)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-amber-200 dark:border-amber-800">
                      <span className="text-sm font-medium">Annual Total:</span>
                      <span className="font-semibold text-sm">{formatCurrency(calculatedPricing.annualCosts)}</span>
                    </div>
                  </div>
                </div>

                {/* First Year Context */}
                <div className="p-3 bg-amber-100/50 dark:bg-amber-900/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">First Year Total:</span>
                    <span className="font-bold text-amber-800 dark:text-amber-200">{formatCurrency(calculatedPricing.firstYearTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-amber-600 dark:text-amber-400">Monthly Average:</span>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      {formatCurrency(calculatedPricing.firstYearTotal / 12)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice Type Selection */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  📋 Invoice Type
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Select Invoice Type</Label>
                    <Select value={invoiceData.invoiceType} onValueChange={(value: 'development' | 'maintenance' | 'payg') => setInvoiceData({ ...invoiceData, invoiceType: value })}>
                      <SelectTrigger className="mt-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">🚀 Development Invoice</SelectItem>
                        <SelectItem value="maintenance">🔧 Maintenance Invoice</SelectItem>
                        <SelectItem value="payg">⏱️ Pay-As-You-Go Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      {invoiceData.invoiceType === 'development' && 'One-time development costs for website creation'}
                      {invoiceData.invoiceType === 'maintenance' && 'Monthly or annual maintenance plan subscription'}
                      {invoiceData.invoiceType === 'payg' && 'Billable hours for support and updates'}
                    </p>
                  </div>

                  {/* Maintenance Plan Selector for Maintenance Invoices */}
                  {invoiceData.invoiceType === 'maintenance' && (
                    <div>
                      <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Maintenance Plan</Label>
                      <Select defaultValue={project.requirements.maintenance || 'none'}>
                        <SelectTrigger className="mt-1 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic Plan - $75/month</SelectItem>
                          <SelectItem value="plus">Plus Plan - $125/month</SelectItem>
                          <SelectItem value="payg">Pay-As-You-Go - $40/hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Pay-As-You-Go Hours Input */}
                  {invoiceData.invoiceType === 'payg' && (
                    <div>
                      <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Hours Worked</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0.25"
                        placeholder="1.5"
                        className="mt-1 h-10"
                      />
                      <p className="text-sm text-gray-500 mt-1">Enter hours worked (in 15-minute increments)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Settings */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  ⚙️ Payment Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Terms</Label>
                    <Select value={invoiceData.paymentTerms} onValueChange={(value) => setInvoiceData({ ...invoiceData, paymentTerms: value })}>
                      <SelectTrigger className="mt-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                        <SelectItem value="net_15">Net 15 Days</SelectItem>
                        <SelectItem value="net_30">Net 30 Days</SelectItem>
                        <SelectItem value="net_60">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Due Date</Label>
                    <Input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
                      className="mt-1 h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Duration</Label>
                    <Input
                      value={invoiceData.duration}
                      onChange={(e) => setInvoiceData({ ...invoiceData, duration: e.target.value })}
                      className="mt-1 h-10"
                      placeholder="e.g., 4 weeks"
                    />
                  </div>
                </div>
              </div>

              {/* Validation Status */}
              {hasErrors && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    ⚠️ Please fix the errors above before creating the invoice
                  </p>
                </div>
              )}

              {/* Invoice Preview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  👁️ Invoice Preview
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-sm">
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-base">INVOICE</h4>
                        <p className="text-xs text-gray-500">INV-{Date.now().toString().slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{invoiceData.ownerName}</p>
                        <p className="text-xs text-gray-500">{invoiceData.ownerEmail}</p>
                        {invoiceData.ownerCompany && <p className="text-xs text-gray-500">{invoiceData.ownerCompany}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Project:</span>
                      <span className="font-medium">{invoiceData.projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{invoiceData.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span className="font-medium">{formatDate(invoiceData.dueDate)}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Subtotal:</span>
                      <span>${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Tax ({(invoiceData.taxRate * 100).toFixed(0)}%):</span>
                      <span>${taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1 border-t">
                      <span>Total:</span>
                      <span>${totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={onCreateInvoice}
                  disabled={isLoading || hasErrors}
                  className={`w-full h-11 text-base font-semibold ${
                    hasErrors 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  }`}
                >
                  {isLoading ? "🔄 Creating Invoice..." : 
                   hasErrors ? "⚠️ Fix Errors First" : "📄 Create Invoice"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full h-10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
