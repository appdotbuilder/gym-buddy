
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface WorkoutTimerProps {
  onComplete: () => void;
  userId: string;
}

export function WorkoutTimer({ onComplete, userId }: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(120); // Default 2 minutes
  const [totalTime, setTotalTime] = useState(120);
  const [isActive, setIsActive] = useState(true);

  // Load user's timer settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await trpc.getUserSettings.query({ user_id: userId });
        if (settings) {
          setTimeLeft(settings.timer_duration);
          setTotalTime(settings.timer_duration);
        }
      } catch (error) {
        console.error('Failed to load timer settings:', error);
      }
    };
    loadSettings();
  }, [userId]);

  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time: number) => {
          if (time <= 1) {
            setIsActive(false);
            onComplete();
            // Play notification sound (if available)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Rest time is over!', {
                body: 'Time to start your next set',
                icon: '💪'
              });
            }
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else if (interval) {
      window.clearInterval(interval);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkip = () => {
    setIsActive(false);
    onComplete();
  };

  const handleAddTime = () => {
    setTimeLeft((prev: number) => prev + 30);
    setTotalTime((prev: number) => prev + 30);
  };

  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  if (!isActive && timeLeft === 0) {
    return null;
  }

  return (
    <Card className="bg-[#1f6feb] border-[#1f6feb] text-white min-w-[200px]">
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          <div className="text-sm font-medium">Rest Timer</div>
          <div className="text-2xl font-bold font-mono">{formatTime(timeLeft)}</div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-[#1c5bb8]"
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSkip}
              className="flex-1 bg-white text-[#1f6feb] hover:bg-gray-100"
            >
              Skip
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddTime}
              className="flex-1 bg-white text-[#1f6feb] hover:bg-gray-100"
            >
              +30s
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
