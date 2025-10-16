"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Palette, 
  Layout, 
  DollarSign, 
  Server, 
  Wrench,
  ExternalLink,
  CheckCircle,
  Package
} from "lucide-react";
import { 
  calculateProjectCosts, 
  formatCurrency, 
  getPackageInfo, 
  getAddOnInfo, 
  getDomainInfo, 
  getHostingInfo, 
  getMaintenanceInfo,
  WEBSITE_PACKAGES,
  ADD_ONS
} from "@/lib/pricing";

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

interface ProjectDetailsProps {
  project: {
    id: string;
    website_type: string;
    design_preferences?: {
      designStyle?: string;
      referenceWebsites?: string;
      colorScheme?: string;
      layoutPreferences?: string;
    };
    add_ons?: string[];
    domain_info?: {
      domainOption?: string;
      hostingOption?: string;
    };
    maintenance_plan?: string;
  };
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const {
    website_type,
    design_preferences = {},
    add_ons = [],
    domain_info = {},
    maintenance_plan
  } = project;

  // Calculate costs using the new pricing system
  const costs = calculateProjectCosts({
    websiteType: website_type,
    addOns: add_ons,
    domainOption: domain_info.domainOption || 'none',
    hostingOption: domain_info.hostingOption || 'basic',
    maintenancePlan: maintenance_plan || 'none'
  });

  const selectedPackage = getPackageInfo(website_type || '');
  const selectedColorScheme = COLOR_SCHEMES.find(scheme => scheme.id === design_preferences.colorScheme);
  const selectedDomain = getDomainInfo(domain_info.domainOption || 'none');
  const selectedHosting = getHostingInfo(domain_info.hostingOption || 'basic');
  const selectedMaintenance = getMaintenanceInfo(maintenance_plan || 'none');

  return (
    <div className="space-y-6">
      {/* Website Purpose & Package */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Website Purpose & Package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-4 border rounded-lg bg-muted/50">
            <div>
              <h3 className="font-semibold text-lg">
                {selectedPackage?.label || "Unknown Package"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Base website package
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                {selectedPackage ? formatCurrency(selectedPackage.price) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">One-time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Features */}
      {add_ons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Additional Features
            </CardTitle>
            <CardDescription>
              Selected add-ons for your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {add_ons.map(addOnId => {
                const addOn = ADD_ONS.find(item => item.id === addOnId);
                return addOn ? (
                  <div key={addOnId} className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">{addOn.label}</span>
                    <span className="font-semibold text-sm">
                      {formatCurrency(addOn.price)}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Design Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Design Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Design Style */}
          <div>
            <h4 className="font-medium mb-2">Design Style</h4>
            <Badge variant="outline" className="capitalize">
              {design_preferences.designStyle || "Not specified"}
            </Badge>
          </div>

          {/* Color Scheme */}
          {selectedColorScheme && (
            <div>
              <h4 className="font-medium mb-2">Color Scheme</h4>
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium mb-3">{selectedColorScheme.label}</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedColorScheme.colors.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-md border border-gray-200"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <span className="text-xs font-mono">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layout Preferences */}
          <div>
            <h4 className="font-medium mb-2">Layout Preferences</h4>
            <Badge variant="outline" className="capitalize">
              {design_preferences.layoutPreferences || "Not specified"}
            </Badge>
          </div>

          {/* Reference Websites */}
          {design_preferences.referenceWebsites && (
            <div>
              <h4 className="font-medium mb-2">Reference Websites</h4>
              <div className="space-y-2">
                {design_preferences.referenceWebsites.split(',').map((url, index) => {
                  const trimmedUrl = url.trim();
                  if (trimmedUrl) {
                    const displayUrl = trimmedUrl.startsWith('http') 
                      ? trimmedUrl 
                      : `https://${trimmedUrl}`;
                    return (
                      <a
                        key={index}
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {trimmedUrl}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain & Hosting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Domain & Hosting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Domain */}
          <div className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Domain</h4>
              <p className="text-sm text-muted-foreground">
                {selectedDomain?.label || "Not specified"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {selectedDomain ? formatCurrency(selectedDomain.price) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">per year</p>
            </div>
          </div>

          {/* Hosting */}
          <div className="flex justify-between items-center p-3 border rounded-lg">
            <div>
              <h4 className="font-medium">Hosting</h4>
              <p className="text-sm text-muted-foreground">
                {selectedHosting?.label || "Not specified"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {selectedHosting ? formatCurrency(selectedHosting.price * 12) : "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">per year</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance & Support */}
      {selectedMaintenance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance & Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{selectedMaintenance.label}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedMaintenance.description}
                </p>
                {selectedMaintenance.hasFreeMonth && (
                  <Badge variant="secondary" className="mt-1">
                    First month free!
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatCurrency(selectedMaintenance.price)}
                </p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>One-time Costs:</span>
              <span className="font-semibold">{formatCurrency(costs.total.oneTime)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Annual Costs:</span>
              <span className="font-semibold">{formatCurrency(costs.total.annual)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Monthly Average:</span>
              <span className="font-semibold">{formatCurrency(costs.total.monthlyAverage)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold">Total (First Year):</span>
              <span className="font-bold text-primary">{formatCurrency(costs.total.firstYear)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              All prices are in CAD. Annual costs include hosting and maintenance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
