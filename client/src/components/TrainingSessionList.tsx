
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrainingSession, Exercise } from '../../../server/src/schema';

interface TrainingSessionListProps {
  selectedSessionId?: number;
  onSessionSelect?: (session: TrainingSession) => void;
  onExerciseSelect?: (exercise: Exercise) => void;
  userId?: string;
}

export function TrainingSessionList({
  selectedSessionId,
  onSessionSelect,
  onExerciseSelect
}: TrainingSessionListProps) {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTrainingSessions.query();
      setSessions(result);
    } catch (error) {
      console.error('Failed to load training sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExercises = useCallback(async (sessionId: number) => {
    try {
      setIsLoadingExercises(true);
      const result = await trpc.getExercisesBySession.query({ trainingSessionId: sessionId });
      setExercises(result);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (selectedSessionId) {
      loadExercises(selectedSessionId);
    }
  }, [selectedSessionId, loadExercises]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pull':
        return 'bg-[#1f6feb] hover:bg-[#388bfd]';
      case 'push':
        return 'bg-[#d73a49] hover:bg-[#cb2431]';
      case 'legs':
        return 'bg-[#28a745] hover:bg-[#34d058]';
      case 'other':
        return 'bg-[#6f42c1] hover:bg-[#8a63d2]';
      default:
        return 'bg-[#6a737d] hover:bg-[#959da5]';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-[#161b22] border-[#30363d]">
            <CardHeader>
              <Skeleton className="h-6 w-3/4 bg-[#21262d]" />
              <Skeleton className="h-4 w-1/2 bg-[#21262d]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full bg-[#21262d]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Show exercises for selected session
  if (selectedSessionId && onExerciseSelect) {
    if (isLoadingExercises) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#161b22] border-[#30363d]">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 bg-[#21262d]" />
                <Skeleton className="h-4 w-1/2 bg-[#21262d]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full bg-[#21262d]" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {exercises.map((exercise: Exercise) => (
          <Card
            key={exercise.id}
            className="bg-[#161b22] border-[#30363d] hover:border-[#6e7681] transition-colors cursor-pointer"
            onClick={() => onExerciseSelect(exercise)}
          >
            <CardHeader>
              <CardTitle className="text-[#f0f6fc] flex items-center justify-between">
                {exercise.name}
                <Badge variant="outline" className="bg-[#21262d] border-[#30363d] text-[#7d8590]">
                  {exercise.target_series} sets
                </Badge>
              </CardTitle>
              {exercise.description && (
                <CardDescription className="text-[#7d8590]">
                  {exercise.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-[#238636] hover:bg-[#2ea043] text-white">
                Start Exercise
              </Button>
            </CardContent>
          </Card>
        ))}
        {exercises.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-[#7d8590]">No exercises found for this session.</p>
          </div>
        )}
      </div>
    );
  }

  // Show training sessions
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session: TrainingSession) => (
        <Card
          key={session.id}
          className="bg-[#161b22] border-[#30363d] hover:border-[#6e7681] transition-colors cursor-pointer"
          onClick={() => onSessionSelect?.(session)}
        >
          <CardHeader>
            <CardTitle className="text-[#f0f6fc] flex items-center justify-between">
              {session.name}
              <Badge className={`text-white ${getTypeColor(session.type)}`}>
                {session.type.toUpperCase()}
              </Badge>
            </CardTitle>
            {session.description && (
              <CardDescription className="text-[#7d8590]">
                {session.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-[#30363d] text-[#e6edf3] hover:bg-[#21262d]">
              View Exercises
            </Button>
          </CardContent>
        </Card>
      ))}
      {sessions.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-[#7d8590]">No training sessions available. Please initialize the training data.</p>
        </div>
      )}
    </div>
  );
}
