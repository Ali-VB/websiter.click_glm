"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ProjectStage, 
  getStageProgress, 
  getStageInfo, 
  stageOrder,
  clientStageInfo,
  adminStageInfo,
  getNextStage,
  canTransitionTo
} from "@/lib/project-stages";
import { CheckCircle, Clock, AlertCircle, Calendar, Play, Pause, RotateCcw } from "lucide-react";

interface ProjectTimelineProps {
  currentStage: ProjectStage;
  isAdmin?: boolean;
  showDescription?: boolean;
  compact?: boolean;
  onStageChange?: (newStage: ProjectStage) => void;
  projectId?: string;
}

export function ProjectTimeline({ 
  currentStage, 
  isAdmin = false, 
  showDescription = true,
  compact = false,
  onStageChange,
  projectId
}: ProjectTimelineProps) {
  const [liveStage, setLiveStage] = useState<ProjectStage>(currentStage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Live update effect
  useEffect(() => {
    setLiveStage(currentStage);
    setLastUpdate(new Date());
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentStage]);

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const interval = setInterval(() => {
      // Simulate real-time updates (in production, this would be WebSocket or polling)
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, projectId]);

  const handleStageAdvance = () => {
    const nextStage = getNextStage(liveStage);
    if (nextStage && onStageChange) {
      onStageChange(nextStage);
    }
  };

  const handleStageRevert = () => {
    const currentIndex = stageOrder.indexOf(liveStage);
    if (currentIndex > 0 && onStageChange) {
      onStageChange(stageOrder[currentIndex - 1]);
    }
  };
  const stageInfo = isAdmin ? adminStageInfo : clientStageInfo;
  const currentIndex = stageOrder.indexOf(currentStage);
  
  const getStageIcon = (stage: ProjectStage, index: number) => {
    if (index < currentIndex) {
      return <CheckCircle className="w-4 h-4" />;
    } else if (index === currentIndex) {
      return <Clock className="w-4 h-4" />;
    } else {
      return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStageStatus = (stage: ProjectStage, index: number) => {
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "upcoming";
  };

  const getStageProgress = (stage: ProjectStage, index: number) => {
    if (index < currentIndex) return 100;
    if (index === currentIndex) {
      // Calculate progress within current stage based on overall progress
      const overallProgress = ((currentIndex + 1) / stageOrder.length) * 100;
      const stageStartProgress = (currentIndex / stageOrder.length) * 100;
      const stageProgress = ((overallProgress - stageStartProgress) / (100 / stageOrder.length)) * 100;
      return Math.min(Math.max(stageProgress, 25), 95); // Between 25% and 95%
    }
    return 0;
  };

  if (compact) {
    return (
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (stageOrder.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Stage Nodes */}
        <div className="relative flex justify-between">
          {stageOrder.map((stage, index) => {
            const status = getStageStatus(stage, index);
            const info = stageInfo[stage];
            
            return (
              <div key={stage} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-background transition-all duration-300 ${
                  status === "completed" ? "bg-green-500 text-white" :
                  status === "current" ? "bg-blue-500 text-white animate-pulse" :
                  "bg-gray-300 text-gray-600"
                }`}>
                  {getStageIcon(stage, index)}
                </div>
                <span className={`text-xs mt-2 text-center ${
                  status === "completed" ? "text-green-600 font-medium" :
                  status === "current" ? "text-blue-600 font-medium" :
                  "text-gray-500"
                }`}>
                  {info.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
          Project Timeline
          <Badge variant="outline" className="ml-2">
            {getStageProgress(currentStage, currentIndex)}% Complete
          </Badge>
        </CardTitle>
        {showDescription && (
          <CardDescription>
            Track your project progress through each stage
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{getStageProgress(currentStage, currentIndex)}%</span>
            </div>
            <Progress value={getStageProgress(currentStage, currentIndex)} className="h-2" />
          </div>

          {/* Timeline Stages */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ height: `${(currentIndex / (stageOrder.length - 1)) * 100}%` }}
              />
            </div>
            
            <div className="space-y-6">
              {stageOrder.map((stage, index) => {
                const status = getStageStatus(stage, index);
                const info = stageInfo[stage];
                const progress = getStageProgress(stage, index);
                
                return (
                  <div key={stage} className="relative flex items-start">
                    {/* Timeline Node */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background transition-all duration-300 ${
                      status === "completed" ? "bg-green-500 text-white" :
                      status === "current" ? "bg-blue-500 text-white animate-pulse" :
                      "bg-gray-300 text-gray-600"
                    }`}>
                      {getStageIcon(stage, index)}
                    </div>
                    
                    {/* Stage Content */}
                    <div className="ml-6 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={`font-medium ${
                          status === "completed" ? "text-green-700" :
                          status === "current" ? "text-blue-700" :
                          "text-gray-500"
                        }`}>
                          {info.title}
                        </h4>
                        {status === "current" && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            Current Stage
                          </Badge>
                        )}
                      </div>
                      
                      {showDescription && (
                        <p className={`text-sm mb-2 ${
                          status === "completed" ? "text-green-600" :
                          status === "current" ? "text-blue-600" :
                          "text-gray-500"
                        }`}>
                          {info.description}
                        </p>
                      )}
                      
                      {/* Stage Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Stage Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-1"
                        />
                      </div>
                      
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Timeline Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Stage:</span>
                <p className="font-medium">{stageInfo[currentStage].title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Completed:</span>
                <p className="font-medium">{currentIndex} of {stageOrder.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <p className="font-medium">{getStageProgress(currentStage, currentIndex)}%</p>
              </div>
              <div>
                <span className="text-muted-foreground">Next:</span>
                <p className="font-medium">
                  {currentIndex < stageOrder.length - 1 
                    ? stageInfo[stageOrder[currentIndex + 1]].title 
                    : "Project Complete"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
