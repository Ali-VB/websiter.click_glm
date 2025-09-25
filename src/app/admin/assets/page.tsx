"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AdminLayout } from "@/components/admin-layout";

interface ClientAsset {
  id: string;
  client_id: string;
  client_name: string;
  project_id?: string;
  project_name?: string;
  file_name: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  public_url?: string;
  is_public: boolean;
  folder_id?: string;
  folder_name?: string;
  tags?: string[];
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface AssetFolder {
  id: string;
  client_id: string;
  client_name: string;
  parent_folder_id?: string;
  parent_folder_name?: string;
  name: string;
  description?: string;
  is_public: boolean;
  asset_count: number;
  total_size: number;
  created_at: string;
  updated_at: string;
}

interface StorageUsage {
  client_id: string;
  client_name: string;
  total_assets: number;
  total_size: number;
  file_type_breakdown: Array<{ type: string; count: number; size: number }>;
  monthly_usage: Array<{ month: string; size: number; count: number }>;
  created_at: string;
  updated_at: string;
}

interface OptimizationRecommendation {
  id: string;
  client_id: string;
  client_name: string;
  asset_id?: string;
  asset_name?: string;
  recommendation_type: "compress" | "convert_format" | "delete_duplicate" | "archive_old" | "optimize_storage";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  estimated_savings: number;
  implementation_steps?: string[];
  status: "pending" | "in_progress" | "completed" | "dismissed";
  created_at: string;
  updated_at: string;
}

interface AssetStats {
  total_assets: number;
  total_size: number;
  total_clients: number;
  file_type_distribution: Array<{ type: string; count: number; size: number }>;
  storage_usage_by_client: Array<{ client: string; size: number; count: number }>;
  optimization_opportunities: number;
  potential_savings: number;
  recent_uploads: Array<{ date: string; count: number; size: number }>;
}

export default function AdminAssetsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<ClientAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<ClientAsset[]>([]);
  const [folders, setFolders] = useState<AssetFolder[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to view the admin portal");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/assets", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
        setFilteredAssets(data.assets || []);
        setFolders(data.folders || []);
        setStorageUsage(data.storageUsage || []);
        setRecommendations(data.recommendations || []);
        setStats(data.stats || null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch assets");
      }
    } catch (err) {
      setError("An error occurred while loading assets");
      console.error("Admin assets error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    // Apply filters
    let result = assets;
    
    if (clientFilter !== "all") {
      result = result.filter(asset => asset.client_id === clientFilter);
    }
    
    if (typeFilter !== "all") {
      result = result.filter(asset => asset.file_type === typeFilter);
    }
    
    if (searchTerm) {
      result = result.filter(asset => 
        asset.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.project_name && asset.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredAssets(result);
  }, [assets, clientFilter, typeFilter, searchTerm]);

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case "image":
        return "bg-blue-100 text-blue-800";
      case "document":
        return "bg-green-100 text-green-800";
      case "video":
        return "bg-purple-100 text-purple-800";
      case "audio":
        return "bg-yellow-100 text-yellow-800";
      case "archive":
        return "bg-orange-100 text-orange-800";
      case "code":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRecommendationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleViewAssetDetails = (asset: ClientAsset) => {
    setSelectedAsset(asset);
    setIsDetailsModalOpen(true);
  };

  const handleOptimizeAsset = async (assetId: string, recommendationId: string) => {
    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to optimize assets");
        return;
      }

      const response = await fetch(`/api/admin/assets/${assetId}/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
        body: JSON.stringify({ recommendationId }),
      });

      if (response.ok) {
        await fetchAssets();
        setIsOptimizationModalOpen(false);
        setSelectedAsset(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to optimize asset");
      }
    } catch (err) {
      setError("An error occurred while optimizing the asset");
      console.error("Optimize asset error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm("Are you sure you want to delete this asset? This action cannot be undone.")) {
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const token = localStorage.getItem("supabase.auth.token");
      
      if (!token) {
        setError("You must be logged in to delete assets");
        return;
      }

      const response = await fetch(`/api/admin/assets/${assetId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access_token}`,
        },
      });

      if (response.ok) {
        await fetchAssets();
        setIsDetailsModalOpen(false);
        setSelectedAsset(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete asset");
      }
    } catch (err) {
      setError("An error occurred while deleting the asset");
      console.error("Delete asset error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getClientSelectItems = () => {
    const clients = Array.from(new Set(assets.map(a => a.client_id))).map(clientId => {
      const asset = assets.find(a => a.client_id === clientId);
      return {
        id: clientId,
        name: asset?.client_name || "Unknown",
      };
    });
    
    return clients.map(client => (
      <SelectItem key={client.id} value={client.id}>
        {client.name}
      </SelectItem>
    ));
  };

  const getFileTypeSelectItems = () => {
    const fileTypes = Array.from(new Set(assets.map(a => a.file_type)));
    
    return fileTypes.map(type => (
      <SelectItem key={type} value={type}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </SelectItem>
    ));
  };

  const getAssetRecommendations = (assetId: string) => {
    return recommendations.filter(r => r.asset_id === assetId && r.status === "pending");
  };

  return (
    <AdminLayout
      title="Asset Management"
      showRefresh={true}
      onRefresh={fetchAssets}
      isLoading={isLoading}
    >
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-muted-foreground">
            Advanced asset management with storage optimization, usage tracking, and cleanup recommendations
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
            {error}
          </div>
        )}

        {/* Asset Statistics Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.total_assets.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Assets</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{formatFileSize(stats.total_size)}</div>
              <div className="text-sm text-muted-foreground">Total Storage</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.total_clients}</div>
              <div className="text-sm text-muted-foreground">Active Clients</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{stats.optimization_opportunities}</div>
              <div className="text-sm text-muted-foreground">Optimization Opportunities</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">{formatFileSize(stats.potential_savings)}</div>
              <div className="text-sm text-muted-foreground">Potential Savings</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Assets</Label>
              <Input
                id="search"
                placeholder="Search by name, client, or project"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="clientFilter">Filter by Client</Label>
              <Select onValueChange={(value) => setClientFilter(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {getClientSelectItems()}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="typeFilter">Filter by Type</Label>
              <Select onValueChange={(value) => setTypeFilter(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getFileTypeSelectItems()}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Assets Table */}
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Client Assets</h2>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredAssets.length} of {assets.length} assets
                </div>
              </div>

              {filteredAssets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No assets found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Name</th>
                        <th className="text-left py-3 px-4">Client</th>
                        <th className="text-left py-3 px-4">Project</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Size</th>
                        <th className="text-left py-3 px-4">Folder</th>
                        <th className="text-left py-3 px-4">Created</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssets.map((asset) => {
                        const assetRecommendations = getAssetRecommendations(asset.id);
                        return (
                          <tr key={asset.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{asset.file_name}</div>
                                {asset.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {asset.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{asset.client_name}</div>
                            </td>
                            <td className="py-3 px-4">
                              {asset.project_name && (
                                <div className="text-sm">{asset.project_name}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFileTypeColor(asset.file_type)}`}>
                                {asset.file_type.charAt(0).toUpperCase() + asset.file_type.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium">{formatFileSize(asset.file_size)}</div>
                            </td>
                            <td className="py-3 px-4">
                              {asset.folder_name && (
                                <div className="text-sm">{asset.folder_name}</div>
                              )}
                            </td>
                            <td className="py-3 px-4">{formatDate(asset.created_at)}</td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewAssetDetails(asset)}
                                >
                                  Details
                                </Button>
                                {asset.public_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(asset.public_url, '_blank')}
                                  >
                                    View
                                  </Button>
                                )}
                                {assetRecommendations.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAsset(asset);
                                      setIsOptimizationModalOpen(true);
                                    }}
                                    disabled={isProcessing}
                                  >
                                    Optimize
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Storage Usage by Client */}
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Storage Usage by Client</h2>
              
              {storageUsage.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No storage usage data available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Client</th>
                        <th className="text-left py-3 px-4">Assets</th>
                        <th className="text-left py-3 px-4">Total Size</th>
                        <th className="text-left py-3 px-4">File Types</th>
                        <th className="text-left py-3 px-4">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageUsage.map((usage) => (
                        <tr key={usage.client_id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{usage.client_name}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{usage.total_assets.toLocaleString()}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{formatFileSize(usage.total_size)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {usage.file_type_breakdown.slice(0, 3).map((type) => (
                                <span
                                  key={type.type}
                                  className={`px-1 py-0.5 rounded text-xs font-medium ${getFileTypeColor(type.type)}`}
                                >
                                  {type.type}
                                </span>
                              ))}
                              {usage.file_type_breakdown.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{usage.file_type_breakdown.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">{formatDate(usage.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Optimization Recommendations */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Optimization Recommendations</h2>
              
              {recommendations.filter(r => r.status === "pending").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No optimization recommendations available.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Client</th>
                        <th className="text-left py-3 px-4">Asset</th>
                        <th className="text-left py-3 px-4">Recommendation</th>
                        <th className="text-left py-3 px-4">Priority</th>
                        <th className="text-left py-3 px-4">Savings</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations
                        .filter(r => r.status === "pending")
                        .map((recommendation) => (
                        <tr key={recommendation.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{recommendation.client_name}</div>
                          </td>
                          <td className="py-3 px-4">
                            {recommendation.asset_name && (
                              <div className="text-sm">{recommendation.asset_name}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{recommendation.title}</div>
                              <div className="text-sm text-muted-foreground">{recommendation.description}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                              {recommendation.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{formatFileSize(recommendation.estimated_savings)}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecommendationStatusColor(recommendation.status)}`}>
                              {recommendation.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {recommendation.asset_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOptimizeAsset(recommendation.asset_id, recommendation.id)}
                                  disabled={isProcessing}
                                >
                                  Apply
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </section>

      {/* Asset Details Modal */}
      {isDetailsModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Asset Details</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAsset.file_name} - {formatFileSize(selectedAsset.file_size)}
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Name</Label>
                  <div className="mt-1 font-medium">{selectedAsset.file_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">File Type</Label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getFileTypeColor(selectedAsset.file_type)}`}>
                      {selectedAsset.file_type.charAt(0).toUpperCase() + selectedAsset.file_type.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedAsset.client_name}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Size</Label>
                  <div className="mt-1 font-medium">{formatFileSize(selectedAsset.file_size)}</div>
                </div>
              </div>

              {selectedAsset.project_name && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Project</Label>
                  <div className="mt-1 font-medium">{selectedAsset.project_name}</div>
                </div>
              )}

              {selectedAsset.folder_name && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Folder</Label>
                  <div className="mt-1 font-medium">{selectedAsset.folder_name}</div>
                </div>
              )}

              {selectedAsset.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <div className="mt-1">{selectedAsset.description}</div>
                </div>
              )}

              {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedAsset.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <div className="mt-1">{formatDateTime(selectedAsset.created_at)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Updated</Label>
                  <div className="mt-1">{formatDateTime(selectedAsset.updated_at)}</div>
                </div>
              </div>

              {selectedAsset.public_url && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Public URL</Label>
                  <div className="mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedAsset.public_url, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {selectedAsset.public_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedAsset.public_url, '_blank')}
                  >
                    View Asset
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteAsset(selectedAsset.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Deleting..." : "Delete Asset"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Modal */}
      {isOptimizationModalOpen && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg border max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Optimization Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAsset.file_name} - {formatFileSize(selectedAsset.file_size)}
                </p>
              </div>
              <Button variant="outline" onClick={() => setIsOptimizationModalOpen(false)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              {getAssetRecommendations(selectedAsset.id).length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No optimization recommendations available for this asset.</p>
                </div>
              ) : (
                getAssetRecommendations(selectedAsset.id).map((recommendation) => (
                  <Card key={recommendation.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{recommendation.title}</h4>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                          {recommendation.priority}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          Save {formatFileSize(recommendation.estimated_savings)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{recommendation.description}</p>
                    
                    {recommendation.implementation_steps && recommendation.implementation_steps.length > 0 && (
                      <div className="mb-3">
                        <Label className="text-sm font-medium text-muted-foreground">Implementation Steps:</Label>
                        <ol className="text-sm mt-1 ml-4 list-decimal">
                          {recommendation.implementation_steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => selectedAsset.id && handleOptimizeAsset(selectedAsset.id, recommendation.id)}
                        disabled={isProcessing || !selectedAsset.id}
                      >
                        {isProcessing ? "Applying..." : "Apply Optimization"}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
