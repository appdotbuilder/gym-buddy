
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { BodyMetric, CreateBodyMetricInput, BodyMetricType } from '../../../server/src/schema';

interface BodyMetricsTrackerProps {
  userId: string;
}

const METRIC_TYPES: { value: BodyMetricType; label: string; defaultUnit: string; icon: string }[] = [
  { value: 'arms', label: 'Arms', defaultUnit: 'cm', icon: '💪' },
  { value: 'legs', label: 'Legs', defaultUnit: 'cm', icon: '🦵' },
  { value: 'core', label: 'Core', defaultUnit: 'cm', icon: '🫃' },
  { value: 'chest', label: 'Chest', defaultUnit: 'cm', icon: '🫁' },
  { value: 'shoulders', label: 'Shoulders', defaultUnit: 'cm', icon: '🤷' },
  { value: 'waist', label: 'Waist', defaultUnit: 'cm', icon: '⭕' },
  { value: 'weight', label: 'Weight', defaultUnit: 'kg', icon: '⚖️' }
];

export function BodyMetricsTracker({ userId }: BodyMetricsTrackerProps) {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<BodyMetricType>('weight');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('kg');

  const loadMetrics =  useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getBodyMetrics.query({ user_id: userId });
      setMetrics(result);
    } catch (error) {
      console.error('Failed to load body metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    const selectedType = METRIC_TYPES.find((t) => t.value === selectedMetricType);
    if (selectedType) {
      setUnit(selectedType.defaultUnit);
    }
  }, [selectedMetricType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || parseFloat(value) <= 0) return;

    try {
      setIsSaving(true);
      const metricData: CreateBodyMetricInput = {
        user_id: userId,
        metric_type: selectedMetricType,
        value: parseFloat(value),
        unit
      };

      const newMetric = await trpc.createBodyMetric.mutate(metricData);
      setMetrics((prev: BodyMetric[]) => [newMetric, ...prev]);
      setValue('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save body metric:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getLatestMetricForType = (type: BodyMetricType) => {
    const typeMetrics = metrics.filter((m: BodyMetric) => m.metric_type === type);
    return typeMetrics.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
  };

  const getMetricIcon = (type: BodyMetricType) => {
    return METRIC_TYPES.find((t) => t.value === type)?.icon || '📊';
  };

  const getMetricLabel = (type: BodyMetricType) => {
    return METRIC_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] mb-2">Body Metrics</h2>
        <p className="text-[#7d8590]">Track your physical progress over time</p>
      </div>

      {showSuccess && (
        <Alert className="border-[#238636] bg-[#0d1117]">
          <AlertDescription className="text-[#238636]">
            📊 Body metric recorded successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Metric */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="text-[#f0f6fc]">Record New Measurement</CardTitle>
          <CardDescription className="text-[#7d8590]">
            Add a new body metric measurement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[#7d8590]">Metric Type</Label>
                <Select value={selectedMetricType} onValueChange={(value: BodyMetricType) => setSelectedMetricType(value)}>
                  <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-[#30363d]">
                    {METRIC_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-[#e6edf3] focus:bg-[#21262d]">
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#7d8590]">Value</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  placeholder="Enter measurement"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label className="text-[#7d8590]">Unit</Label>
                <Input
                  value={unit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnit(e.target.value)}
                  className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                  placeholder="Unit"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSaving || !value}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white"
            >
              {isSaving ? 'Recording...' : 'Record Measurement'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4">Current Measurements</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {METRIC_TYPES.map((type) => {
            const latestMetric = getLatestMetricForType(type.value);
            return (
              <Card key={type.value} className="bg-[#161b22] border-[#30363d]">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#7d8590] text-sm">{type.icon} {type.label}</span>
                    {latestMetric && (
                      <Badge variant="outline" className="bg-[#21262d] border-[#30363d] text-[#7d8590]">
                        Latest
                      </Badge>
                    )}
                  </div>
                  {latestMetric ? (
                    <div>
                      <div className="text-2xl font-bold text-[#f0f6fc]">
                        {latestMetric.value} {latestMetric.unit}
                      </div>
                      <div className="text-xs text-[#7d8590] mt-1">
                        {latestMetric.recorded_at.toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#7d8590]">No data yet</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Metrics History */}
      <div>
        <h3 className="text-lg font-semibold text-[#f0f6fc] mb-4">Recent History</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#21262d] rounded animate-pulse"></div>
            ))}
          </div>
        ) : (
          <Card className="bg-[#161b22] border-[#30363d]">
            <CardContent className="p-0">
              {metrics.length === 0 ? (
                <div className="p-6 text-center text-[#7d8590]">
                  No metrics recorded yet. Add your first measurement above!
                </div>
              ) : (
                <div className="divide-y divide-[#21262d]">
                  {metrics.slice(0, 10).map((metric: BodyMetric) => (
                    <div key={metric.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getMetricIcon(metric.metric_type)}</span>
                        <div>
                          <div className="text-[#f0f6fc] font-medium">
                            {getMetricLabel(metric.metric_type)}
                          </div>
                          <div className="text-sm text-[#7d8590]">
                            {metric.recorded_at.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#f0f6fc] font-semibold">
                          {metric.value} {metric.unit}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
