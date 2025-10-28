"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Clock, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { 
  MAINTENANCE_PLANS, 
  PAYG_PRICING, 
  calculatePAYGCost, 
  calculateBillableHours,
  formatCurrency,
  generateTimeEstimate,
  getMaintenanceInfo
} from "@/lib/pricing";

interface MaintenanceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    maintenance_plan?: string;
  };
  onSubmit: (request: MaintenanceRequest) => void;
  isLoading: boolean;
}

interface MaintenanceRequest {
  type: 'emergency' | 'content_update' | 'technical_issue' | 'new_feature' | 'consultation';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedHours?: number;
  budgetRange?: string;
  preferredPlan?: string;
  currentMaintenancePlan?: string;
}

export default function MaintenanceRequestModal({
  isOpen,
  onClose,
  project,
  onSubmit,
  isLoading
}: MaintenanceRequestModalProps) {
  const [requestData, setRequestData] = useState<MaintenanceRequest>({
    type: 'technical_issue',
    urgency: 'medium',
    description: '',
    currentMaintenancePlan: project.maintenance_plan || 'none'
  });

  const [estimatedHours, setEstimatedHours] = useState(1);
  const [showPayGCalculator, setShowPayGCalculator] = useState(false);

  const currentPlan = getMaintenanceInfo(requestData.currentMaintenancePlan || 'none');
  const paygCost = calculatePAYGCost(calculateBillableHours(estimatedHours));

  const handleSubmit = () => {
    if (!requestData.description.trim()) return;
    
    onSubmit({
      ...requestData,
      estimatedHours: requestData.currentMaintenancePlan === 'none' ? estimatedHours : undefined
    });
  };

  const isWorkCoveredByPlan = () => {
    if (!currentPlan || requestData.currentMaintenancePlan === 'none') return false;
    
    switch (requestData.currentMaintenancePlan) {
      case 'basic':
        return requestData.type === 'emergency' && requestData.urgency === 'critical';
      case 'plus':
        return (requestData.type === 'emergency' && requestData.urgency === 'critical') ||
               (requestData.type === 'content_update' && estimatedHours <= 1);
      default:
        return false;
    }
  };

  const getRequestTypeInfo = () => {
    switch (requestData.type) {
      case 'emergency':
        return {
          title: '🚨 Emergency Support',
          description: 'Critical issues requiring immediate attention',
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'content_update':
        return {
          title: '📝 Content Update',
          description: 'Text changes, image updates, blog posts',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'technical_issue':
        return {
          title: '🔧 Technical Issue',
          description: 'Bug fixes, performance issues, errors',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      case 'new_feature':
        return {
          title: '✨ New Feature',
          description: 'Add new functionality or capabilities',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      case 'consultation':
        return {
          title: '💡 Consultation',
          description: 'Advice, strategy, planning session',
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        };
    }
  };

  const typeInfo = getRequestTypeInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[95vw] max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold">Request Maintenance Support</h2>
            <p className="text-muted-foreground">Get help with your website: {project.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Current Maintenance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Maintenance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {currentPlan?.label || 'No Plan (Pay-As-You-Go)'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentPlan?.description || 'You are currently on pay-as-you-go billing - pay only when you need help'}
                    </p>
                  </div>
                  <Badge variant={currentPlan?.price ? 'default' : 'secondary'}>
                    {currentPlan?.price ? 'Active' : 'Pay-As-You-Go'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Pay-As-You-Go Pricing Info */}
            {requestData.currentMaintenancePlan === 'none' && (
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    Pay-As-You-Go Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">$40</div>
                        <div className="text-sm text-muted-foreground">per hour</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">15 min</div>
                        <div className="text-sm text-muted-foreground">increments</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">$10</div>
                        <div className="text-sm text-muted-foreground">minimum charge</div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">How it works:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Submit your request and we'll review it</li>
                        <li>• We'll provide an estimate and timeline</li>
                        <li>• Work is billed in 15-minute increments</li>
                        <li>• You'll receive a separate invoice for the work</li>
                        <li>• No monthly commitment - pay only when you need help</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Request Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What do you need help with?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: 'emergency', icon: '🚨', label: 'Emergency' },
                    { value: 'content_update', icon: '📝', label: 'Content Update' },
                    { value: 'technical_issue', icon: '🔧', label: 'Technical Issue' },
                    { value: 'new_feature', icon: '✨', label: 'New Feature' },
                    { value: 'consultation', icon: '💡', label: 'Consultation' },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      variant={requestData.type === type.value ? 'default' : 'outline'}
                      className="justify-start h-auto p-4"
                      onClick={() => setRequestData({ ...requestData, type: type.value as MaintenanceRequest['type'] })}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{type.icon}</span>
                        <div className="text-left">
                          <div className="font-medium">{type.label}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                <div className={`mt-4 p-4 rounded-lg border ${typeInfo.bgColor} ${typeInfo.borderColor}`}>
                  <h4 className={`font-medium ${typeInfo.color}`}>{typeInfo.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{typeInfo.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Urgency Level */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How urgent is this?</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={requestData.urgency} onValueChange={(value: MaintenanceRequest['urgency']) => setRequestData({ ...requestData, urgency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Low - Can wait a few days
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Medium - Within 48 hours
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        High - Within 24 hours
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Critical - Immediate attention needed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Description - Most Important Field */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  Describe what you need help with
                </CardTitle>
                <CardDescription>
                  This is the most important field - please be as detailed as possible so we can help you effectively.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Please describe in detail what you need help with. Include:
• What specific issue or task you need help with
• Any error messages you're seeing
• Steps to reproduce the problem (if applicable)
• What you expect the final result to be
• Any deadlines or time constraints
• URLs or page references (if applicable)"
                  value={requestData.description}
                  onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                  className="min-h-[200px] text-base"
                />
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>💡 Pro Tip:</strong> The more detailed your description, the faster and more accurately we can help you. Include screenshots, error messages, and specific examples whenever possible.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Expectation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expected Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {requestData.urgency === 'critical' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span><strong>1-2 hours</strong> (Emergency response)</span>
                    </div>
                  )}
                  {requestData.urgency === 'high' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span><strong>4-8 hours</strong> (Priority response)</span>
                    </div>
                  )}
                  {requestData.urgency === 'medium' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span><strong>24-48 hours</strong> (Standard response)</span>
                    </div>
                  )}
                  {requestData.urgency === 'low' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span><strong>2-3 business days</strong> (Regular response)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={!requestData.description.trim() || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Submitting Request..." : "Submit Support Request (Pay-As-You-Go)"}
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full" size="lg">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
