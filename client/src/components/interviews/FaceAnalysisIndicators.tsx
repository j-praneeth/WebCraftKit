import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Smile, Shield, Activity, EyeOff } from 'lucide-react';
import { FaceAnalysisMetrics } from './MediaPipeFaceAnalyzer';

interface FaceAnalysisIndicatorsProps {
  metrics: FaceAnalysisMetrics | null;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function FaceAnalysisIndicators({
  metrics,
  isVisible,
  onToggleVisibility
}: FaceAnalysisIndicatorsProps) {
  const [historicalData, setHistoricalData] = useState<{
    attention: number[];
    positivity: number[];
    confidence: number[];
    arousal: number[];
  }>({
    attention: [],
    positivity: [],
    confidence: [],
    arousal: []
  });

  // Update historical data
  useEffect(() => {
    if (metrics) {
      setHistoricalData(prev => ({
        attention: [...prev.attention.slice(-29), metrics.attention],
        positivity: [...prev.positivity.slice(-29), metrics.positivity],
        confidence: [...prev.confidence.slice(-29), metrics.confidence],
        arousal: [...prev.arousal.slice(-29), metrics.arousal]
      }));
    }
  }, [metrics]);

  // Calculate averages
  const getAverage = (values: number[]) => {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  // Get color based on value
  const getProgressColor = (value: number, type: 'attention' | 'positivity' | 'confidence' | 'arousal') => {
    if (type === 'arousal') {
      // For arousal: 0-30 = red (uncomfortable), 31-70 = yellow (neutral), 71-100 = green (happy)
      if (value <= 30) return 'bg-red-500';
      if (value <= 70) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    
    // For other metrics: standard green scale
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get arousal state label
  const getArousalState = (value: number) => {
    if (value <= 30) return { label: 'Uncomfortable', color: 'destructive' };
    if (value <= 70) return { label: 'Neutral', color: 'secondary' };
    return { label: 'Happy', color: 'default' };
  };

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          Show Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-600" />
              Face Analysis
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Attention */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Attention</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Avg: {getAverage(historicalData.attention)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {metrics?.attention || 0}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={metrics?.attention || 0} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              {metrics?.eyeGaze.looking_forward ? 'Looking forward' : `Looking ${metrics?.eyeGaze.gaze_direction || 'away'}`}
            </div>
          </div>

          {/* Positivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smile className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Positivity</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Avg: {getAverage(historicalData.positivity)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {metrics?.positivity || 0}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={metrics?.positivity || 0} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              Smile: {metrics?.facialFeatures.smile_intensity || 0}%
            </div>
          </div>

          {/* Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Confidence</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Avg: {getAverage(historicalData.confidence)}%
                </span>
                <Badge variant="outline" className="text-xs">
                  {metrics?.confidence || 0}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={metrics?.confidence || 0} 
              className="h-2"
            />
            <div className="text-xs text-muted-foreground">
              Posture stability: {metrics ? Math.round(100 - Math.abs(metrics.headPose.roll) * 2) : 0}%
            </div>
          </div>

          {/* Arousal (Happy/Uncomfortable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Arousal</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Avg: {getAverage(historicalData.arousal)}%
                </span>
                <Badge 
                  variant={getArousalState(metrics?.arousal || 50).color as any}
                  className="text-xs"
                >
                  {getArousalState(metrics?.arousal || 50).label}
                </Badge>
              </div>
            </div>
            <Progress 
              value={metrics?.arousal || 50} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uncomfortable</span>
              <span>Neutral</span>
              <span>Happy</span>
            </div>
          </div>

          {/* Real-time status */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${metrics ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={metrics ? 'text-green-600' : 'text-red-600'}>
                  {metrics ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            {metrics && (
              <div className="mt-1 text-xs text-muted-foreground">
                Head pose: {Math.round(metrics.headPose.yaw)}° yaw, {Math.round(metrics.headPose.pitch)}° pitch
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}