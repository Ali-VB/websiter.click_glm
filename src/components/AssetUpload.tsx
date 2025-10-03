"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/supabase';

interface Asset {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  asset_type: string;
  uploaded_by: string;
  created_at: string;
}

interface UploadResult {
  message: string;
  asset?: Asset;
  error?: string;
}

interface Project {
    id: string;
    name: string;
}

interface Asset {
    id: string;
    file_name: string;
    file_url: string;
    asset_type: string;
    created_at: string;
}

interface AssetUploadProps {
    projects: Project[];
}

export default function AssetUpload({ projects }: AssetUploadProps) {
    const [session, setSession] = useState<any>(null);
    const [selectedProject, setSelectedProject] = useState("");
    const [selectedAssetType, setSelectedAssetType] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<{
        type: 'idle' | 'success' | 'error';
        message: string;
    }>({ type: 'idle', message: '' });
    const [uploadedFiles, setUploadedFiles] = useState<Asset[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get current session
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
        };
        getSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const assetTypes = [
        { id: 'images', name: 'Images', icon: '🖼️' },
        { id: 'documents', name: 'Documents', icon: '📄' },
        { id: 'logos', name: 'Logos', icon: '🎨' },
        { id: 'content', name: 'Content', icon: '📝' },
    ];

    // Fetch all user assets on component mount and when project is selected
    useEffect(() => {
        if (session?.access_token) {
            if (selectedProject) {
                fetchAssets();
            } else {
                fetchAllAssets();
            }
        }
    }, [selectedProject, session]);

    const fetchAllAssets = async () => {
        try {
            if (!session?.access_token) return;

            const response = await fetch(`/api/assets`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUploadedFiles(data.assets || []);
            }
        } catch (error) {
            console.error("Error fetching all assets:", error);
        }
    };

    const fetchAssets = async () => {
        try {
            if (!session?.access_token) return;

            const response = await fetch(`/api/assets?projectId=${selectedProject}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUploadedFiles(data.assets || []);
            }
        } catch (error) {
            console.error("Error fetching assets:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(e.target.files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFiles(e.dataTransfer.files);
        }
    };

    const handleUpload = async () => {
        if (!selectedProject || !selectedAssetType || !selectedFiles || selectedFiles.length === 0) {
            setUploadStatus({
                type: 'error',
                message: 'Please select a project, asset type, and at least one file'
            });
            return;
        }

        setIsUploading(true);
        setUploadStatus({ type: 'idle', message: '' });

        try {
            if (!session?.access_token) {
                setUploadStatus({
                    type: 'error',
                    message: 'You must be logged in to upload files'
                });
                setIsUploading(false);
                return;
            }

            // Upload each file
            const uploadPromises = Array.from(selectedFiles).map(async (file: File) => {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('projectId', selectedProject);
                formData.append('assetType', selectedAssetType);

                const response = await fetch('/api/assets', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: formData,
                });

                return response.json();
            });

            const results = await Promise.all(uploadPromises);

            // Check if all uploads were successful
            const allSuccessful = results.every((result: UploadResult) => result.message === 'File uploaded successfully');

            if (allSuccessful) {
                setUploadStatus({
                    type: 'success',
                    message: `Successfully uploaded ${selectedFiles.length} file(s)`
                });

                // Reset form
                setSelectedFiles(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                // Refresh assets list
                if (selectedProject) {
                    fetchAssets();
                } else {
                    fetchAllAssets();
                }
            } else {
                setUploadStatus({
                    type: 'error',
                    message: 'Some files failed to upload. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            setUploadStatus({
                type: 'error',
                message: 'An error occurred while uploading files'
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getAssetIcon = (assetType: string) => {
        const type = assetTypes.find(t => t.id === assetType);
        return type ? type.icon : '📄';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
                <Label htmlFor="project-select">Select Project</Label>
                <select
                    id="project-select"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background"
                >
                    <option value="">Choose a project...</option>
                    {projects.map(project => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Asset Type Selection */}
            <div className="space-y-2">
                <Label>Asset Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {assetTypes.map(type => (
                        <div
                            key={type.id}
                            className={`flex flex-col items-center p-4 border border-input rounded-md cursor-pointer hover:bg-muted/50 ${selectedAssetType === type.id ? 'bg-primary/10 border-primary' : ''
                                }`}
                            onClick={() => setSelectedAssetType(type.id)}
                        >
                            <div className="text-2xl mb-2">{type.icon}</div>
                            <span className="text-sm">{type.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* File Upload Area */}
            <div className="space-y-2">
                <Label htmlFor="file-upload">Upload Files</Label>
                <div
                    className="border-2 border-dashed border-input rounded-md p-8 text-center cursor-pointer hover:bg-muted/50"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-3xl mb-2">📁</div>
                        <p className="text-lg font-medium">Drag & drop files here</p>
                        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB)
                        </p>
                    </div>
                    <Input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                    />
                </div>

                {selectedFiles && selectedFiles.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-medium mb-2">Selected Files:</h4>
                        <div className="space-y-2">
                            {Array.from(selectedFiles).map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <span>📄</span>
                                        <span className="text-sm font-medium">{file.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatFileSize(file.size)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Status */}
            {uploadStatus.type !== 'idle' && (
                <div className={`p-3 rounded-md ${uploadStatus.type === 'success'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {uploadStatus.message}
                </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleUpload}
                    disabled={!selectedProject || !selectedAssetType || !selectedFiles || isUploading}
                >
                    {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Uploaded Assets</h3>
                    <div className="border border-input rounded-md">
                        {uploadedFiles.map((asset) => (
                            <div key={asset.id} className="p-4 border-b border-input last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                                        <span className="text-blue-800">{getAssetIcon(asset.asset_type)}</span>
                                    </div>
                                    <div>
                                        <p className="font-medium">{asset.file_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {asset.asset_type} • Uploaded {formatDate(asset.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
