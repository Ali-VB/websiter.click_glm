"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { X, Check, Star, Clock, Shield, Zap, ArrowRight } from "lucide-react";
import { 
  MAINTENANCE_PLANS, 
  formatCurrency,
  getMaintenanceInfo
} from "@/lib/pricing";

interface MaintenanceUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  project: {
    id: string;
    name: string;
  };
  onUpgrade: (newPlan: string, paymentMethod: string) => void;
  isLoading: boolean;
}

export default function MaintenanceUpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'none',
  project,
  onUpgrade,
  isLoading
}: MaintenanceUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const availablePlans = MAINTENANCE_PLANS.filter(plan => plan.id !== 'none' && plan.id !== 'payg');
  const selectedPlanInfo = getMaintenanceInfo(selectedPlan);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic':
        return <Shield className="h-5 w-5" />;
      case 'plus':
        return <Star className="h-5 w-5" />;
      case 'payg':
        return <Clock className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getPopularBadge = (planId: string) => {
    if (planId === 'plus') {
      return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Most Popular</Badge>;
    }
    return null;
  };

  const getAnnualPrice = (planId: string) => {
    const plan = MAINTENANCE_PLANS.find(p => p.id === planId);
    if (!plan || !plan.price) return 0;
    return plan.price * 12;
  };

  const getAnnualSavings = (planId: string) => {
    const plan = MAINTENANCE_PLANS.find(p => p.id === planId);
    if (!plan || !plan.price) return 0;
    const monthlyTotal = plan.price * 12;
    const yearlyTotal = monthlyTotal * 0.9; // 10% discount for yearly
    return monthlyTotal - yearlyTotal;
  };

  const handleUpgrade = () => {
    const paymentMethod = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    onUpgrade(selectedPlan, paymentMethod);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[95vw] max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold">Upgrade Your Maintenance Plan</h2>
            <p className="text-muted-foreground">Choose the perfect plan for your website: {project.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Current Plan Status */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Current Plan</p>
                <p className="text-lg font-bold">
                  {getMaintenanceInfo(currentPlan)?.label || 'No Plan'}
                </p>
              </div>
              <Badge variant={currentPlan === 'none' ? 'secondary' : 'default'}>
                {currentPlan === 'none' ? 'Inactive' : 'Active'}
              </Badge>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mb-6 flex items-center justify-center">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('monthly')}
                className="px-4"
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBillingCycle('yearly')}
                className="px-4"
              >
                Yearly
                <Badge variant="secondary" className="ml-2 text-xs">Save 10%</Badge>
              </Button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {availablePlans.map((plan) => {
              const isCurrentPlan = plan.id === currentPlan;
              const annualPrice = getAnnualPrice(plan.id);
              const savings = getAnnualSavings(plan.id);
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  } ${isCurrentPlan ? 'opacity-75' : ''}`}
                  onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-2">
                      {getPlanIcon(plan.id)}
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2">
                      {plan.label}
                      {getPopularBadge(plan.id)}
                    </CardTitle>
                    {isCurrentPlan && (
                      <Badge variant="secondary">Current Plan</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold">
                        {plan.price ? formatCurrency(plan.price) : 'Custom'}
                      </div>
                      {plan.price && (
                        <div className="text-sm text-muted-foreground">
                          per month
                          {billingCycle === 'yearly' && (
                            <div className="text-green-600 font-medium mt-1">
                              {formatCurrency(annualPrice)}/year (Save {formatCurrency(savings)})
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="font-medium mb-2">What's Included:</div>
                      <div className="text-muted-foreground">{plan.description}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan !== currentPlan && selectedPlanInfo && (
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upgrade Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">From:</p>
                    <p className="font-medium">{getMaintenanceInfo(currentPlan)?.label || 'No Plan'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To:</p>
                    <p className="font-medium">{selectedPlanInfo.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Billing Cycle:</p>
                    <p className="font-medium capitalize">{billingCycle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost:</p>
                    <p className="font-bold text-lg">
                      {selectedPlanInfo.price 
                        ? billingCycle === 'yearly' 
                          ? formatCurrency(getAnnualPrice(selectedPlan))
                          : formatCurrency(selectedPlanInfo.price)
                        : 'Pay as you go'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpgrade}
            disabled={selectedPlan === currentPlan || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? "Processing..." : (
              <>
                Upgrade Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
