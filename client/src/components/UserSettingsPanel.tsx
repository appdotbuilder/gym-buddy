
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { UpdateUserSettingsInput } from '../../../server/src/schema';

interface UserSettingsPanelProps {
  userId: string;
  onDarkModeChange: (darkMode: boolean) => void;
}

export function UserSettingsPanel({ userId, onDarkModeChange }: UserSettingsPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [timerDuration, setTimerDuration] = useState(120);
  const [darkMode, setDarkMode] = useState(true);
  const [bodyMetricReminder, setBodyMetricReminder] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getUserSettings.query({ user_id: userId });
      if (result) {
        setTimerDuration(result.timer_duration);
        setDarkMode(result.dark_mode);
        setBodyMetricReminder(result.body_metric_reminder_enabled);
        onDarkModeChange(result.dark_mode);
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, onDarkModeChange]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updateData: UpdateUserSettingsInput = {
        user_id: userId,
        timer_duration: timerDuration,
        dark_mode: darkMode,
        body_metric_reminder_enabled: bodyMetricReminder
      };

      await trpc.updateUserSettings.mutate(updateData);
      onDarkModeChange(darkMode);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimerDisplay = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    if (remainingSeconds === 0) return `${minutes}m`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[#21262d] rounded animate-pulse"></div>
        <Card className="bg-[#161b22] border-[#30363d]">
          <CardHeader>
            <div className="h-6 w-32 bg-[#21262d] rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-[#21262d] rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-[#21262d] rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] mb-2">Settings</h2>
        <p className="text-[#7d8590]">Customize your training experience</p>
      </div>

      {showSuccess && (
        <Alert className="border-[#238636] bg-[#0d1117]">
          <AlertDescription className="text-[#238636]">
            ⚙️ Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="text-[#f0f6fc]">Workout Settings</CardTitle>
          <CardDescription className="text-[#7d8590]">
            Configure your workout preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timer Duration */}
          <div className="space-y-2">
            <Label className="text-[#7d8590]">Rest Timer Duration</Label>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                value={timerDuration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimerDuration(parseInt(e.target.value) || 120)}
                className="bg-[#0d1117] border-[#30363d] text-[#e6edf3] w-24"
                min="30"
                max="600"
                step="30"
              />
              <span className="text-[#7d8590]">seconds ({formatTimerDisplay(timerDuration)})</span>
            </div>
            <p className="text-xs text-[#7d8590]">
              Duration of the rest timer between sets (30 seconds to 10 minutes)
            </p>
          </div>

          <Separator className="bg-[#21262d]" />

          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-[#7d8590]">Dark Mode</Label>
              <p className="text-xs text-[#7d8590]">
                Use dark theme throughout the application
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={setDarkMode}
              className="data-[state=checked]:bg-[#238636]"
            />
          </div>

          <Separator className="bg-[#21262d]" />

          {/* Body Metric Reminders */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-[#7d8590]">Body Metric Reminders</Label>
              <p className="text-xs text-[#7d8590]">
                Receive weekly reminders to update your body measurements
              </p>
            </div>
            <Switch
              checked={bodyMetricReminder}
              onCheckedChange={setBodyMetricReminder}
              className="data-[state=checked]:bg-[#238636]"
            />
          </div>

          <Separator className="bg-[#21262d]" />

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card className="bg-[#161b22] border-[#30363d]">
        <CardHeader>
          <CardTitle className="text-[#f0f6fc]">About Training Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-[#7d8590]">
            <p>• Track your workouts with predefined training sessions</p>
            <p>• Monitor your progress with detailed exercise logs</p>
            <p>• Record body metrics to track physical changes</p>
            <p>• Customizable rest timers for optimal recovery</p>
            <p>• GitHub-inspired dark theme for comfortable viewing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
