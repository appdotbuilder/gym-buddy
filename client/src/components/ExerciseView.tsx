
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Exercise, Series, UserExerciseLog, CreateUserExerciseLogInput } from '../../../server/src/schema';
import type { ExerciseWithSeries } from '../../../server/src/handlers/get_exercise_with_series';

interface ExerciseViewProps {
  exercise: Exercise;
  userId: string;
  onStartTimer: () => void;
}

interface SeriesPerformance {
  series_number: number;
  repetitions: number;
  weight: number;
  completed: boolean;
}

export function ExerciseView({ exercise, userId, onStartTimer }: ExerciseViewProps) {
  const [exerciseData, setExerciseData] = useState<ExerciseWithSeries | null>(null);
  const [lastPerformance, setLastPerformance] = useState<UserExerciseLog[]>([]);
  const [currentSeries, setCurrentSeries] = useState(1);
  const [seriesPerformance, setSeriesPerformance] = useState<SeriesPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const loadExerciseData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [exerciseResult, performanceResult] = await Promise.all([
        trpc.getExerciseWithSeries.query({ exerciseId: exercise.id }),
        trpc.getLastExercisePerformance.query({ userId, exerciseId: exercise.id })
      ]);

      setExerciseData(exerciseResult);
      setLastPerformance(performanceResult);

      // Initialize series performance with target values or last performance
      if (exerciseResult) {
        const initialPerformance = exerciseResult.series.map((series: Series) => {
          const lastSeries = performanceResult.find(
            (perf: UserExerciseLog) => perf.series_number === series.series_number
          );
          return {
            series_number: series.series_number,
            repetitions: lastSeries?.repetitions || series.target_repetitions,
            weight: lastSeries?.weight || series.target_weight,
            completed: false
          };
        });
        setSeriesPerformance(initialPerformance);
      }
    } catch (error) {
      console.error('Failed to load exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [exercise.id, userId]);

  useEffect(() => {
    loadExerciseData();
  }, [loadExerciseData]);

  const handleSeriesUpdate = (seriesNumber: number, field: 'repetitions' | 'weight', value: number) => {
    setSeriesPerformance((prev: SeriesPerformance[]) =>
      prev.map((series: SeriesPerformance) =>
        series.series_number === seriesNumber
          ? { ...series, [field]: value }
          : series
      )
    );
  };

  const handleCompleteSet = async (seriesNumber: number) => {
    const series = seriesPerformance.find((s: SeriesPerformance) => s.series_number === seriesNumber);
    if (!series) return;

    try {
      setIsSaving(true);
      const logData: CreateUserExerciseLogInput = {
        user_id: userId,
        exercise_id: exercise.id,
        series_number: seriesNumber,
        repetitions: series.repetitions,
        weight: series.weight
      };

      await trpc.createUserExerciseLog.mutate(logData);

      // Mark series as completed
      setSeriesPerformance((prev: SeriesPerformance[]) =>
        prev.map((s: SeriesPerformance) =>
          s.series_number === seriesNumber ? { ...s, completed: true } : s
        )
      );

      // Move to next series or show completion
      if (seriesNumber < exercise.target_series) {
        setCurrentSeries(seriesNumber + 1);
        onStartTimer(); // Start rest timer
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save series:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletedSetsCount = () => {
    return seriesPerformance.filter((s: SeriesPerformance) => s.completed).length;
  };

  const getProgressPercentage = () => {
    return (getCompletedSetsCount() / exercise.target_series) * 100;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader>
            <div className="h-8 w-3/4 bg-[#21262d] rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-[#21262d] rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-[#21262d] rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exerciseData) {
    return (
      <Alert className="border-[#d73a49] bg-[#161b22]">
        <AlertDescription className="text-[#e6edf3]">
          Failed to load exercise data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="text-[#f0f6fc] flex items-center justify-between">
            {exercise.name}
            <Badge variant="outline" className="bg-[#21262d] border-[#30363d] text-[#7d8590]">
              {getCompletedSetsCount()}/{exercise.target_series} sets
            </Badge>
          </CardTitle>
          {exercise.description && (
            <CardDescription className="text-[#7d8590]">
              {exercise.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#7d8590]">Progress</span>
                <span className="text-sm text-[#7d8590]">{Math.round(getProgressPercentage())}%</span>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="h-2 bg-[#21262d]"
              />
            </div>
            
            {showSuccess && (
              <Alert className="border-[#238636] bg-[#0d1117]">
                <AlertDescription className="text-[#238636]">
                  🎉 Exercise completed! Great job!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Series Cards */}
      <div className="space-y-4">
        {exerciseData.series.map((series: Series) => {
          const performance = seriesPerformance.find(
            (p: SeriesPerformance) => p.series_number === series.series_number
          );
          const lastPerf = lastPerformance.find(
            (p: UserExerciseLog) => p.series_number === series.series_number
          );
          const isCurrentSet = currentSeries === series.series_number;
          const isCompleted = performance?.completed || false;

          return (
            <Card
              key={series.id}
              className={`border transition-colors ${
                isCurrentSet && !isCompleted
                  ? 'bg-[#161b22] border-[#238636]'
                  : isCompleted
                  ? 'bg-[#0d1117] border-[#238636]'
                  : 'bg-[#161b22] border-[#30363d]'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-[#f0f6fc] flex items-center justify-between">
                  Set {series.series_number}
                  {isCompleted && (
                    <Badge className="bg-[#238636] text-white">✓ Completed</Badge>
                  )}
                  {isCurrentSet && !isCompleted && (
                    <Badge className="bg-[#1f6feb] text-white">Current</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-[#7d8590]">Repetitions</Label>
                    <Input
                      type="number"
                      value={performance?.repetitions || series.target_repetitions}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSeriesUpdate(
                          series.series_number,
                          'repetitions',
                          parseInt(e.target.value) || 0
                        )
                      }
                      disabled={isCompleted}
                      className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                      min="1"
                    />
                    <div className="text-xs text-[#7d8590] mt-1">
                      Target: {series.target_repetitions}
                      {lastPerf && ` | Last: ${lastPerf.repetitions}`}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[#7d8590]">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={performance?.weight || series.target_weight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleSeriesUpdate(
                          series.series_number,
                          'weight',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={isCompleted}
                      className="bg-[#0d1117] border-[#30363d] text-[#e6edf3]"
                      min="0"
                    />
                    <div className="text-xs text-[#7d8590] mt-1">
                      Target: {series.target_weight}kg
                      {lastPerf && ` | Last: ${lastPerf.weight}kg`}
                    </div>
                  </div>
                </div>

                {!isCompleted && (
                  <Button
                    onClick={() => handleCompleteSet(series.series_number)}
                    disabled={isSaving || !isCurrentSet}
                    className="w-full bg-[#238636] hover:bg-[#2ea043] text-white disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Complete Set'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
