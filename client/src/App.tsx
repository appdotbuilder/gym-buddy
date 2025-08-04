
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrainingSessionList } from '@/components/TrainingSessionList';
import { ExerciseView } from '@/components/ExerciseView';
import { BodyMetricsTracker } from '@/components/BodyMetricsTracker';
import { UserSettingsPanel } from '@/components/UserSettingsPanel';
import { WorkoutTimer } from '@/components/WorkoutTimer';
import type { TrainingSession, Exercise } from '../../server/src/schema';

// User ID - in real app this would come from authentication
const USER_ID = 'user_123';

function App() {
  const [currentView, setCurrentView] = useState<'sessions' | 'exercise' | 'metrics' | 'settings'>('sessions');
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize training data on app start
  useEffect(() => {
    const initializeData = async () => {
      try {
        await trpc.initializeTrainingData.mutate();
      } catch (error) {
        console.error('Failed to initialize training data:', error);
      }
    };
    initializeData();
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSessionSelect = (session: TrainingSession) => {
    setSelectedSession(session);
    setCurrentView('sessions'); // Stay in sessions view to show exercises
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentView('exercise');
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setSelectedExercise(null);
    setCurrentView('sessions');
  };

  const handleBackToExercises = () => {
    setSelectedExercise(null);
    setCurrentView('sessions');
  };

  const handleStartTimer = () => {
    setIsTimerActive(true);
  };

  const handleTimerComplete = () => {
    setIsTimerActive(false);
  };

  const handleViewChange = (value: string) => {
    setCurrentView(value as 'sessions' | 'exercise' | 'metrics' | 'settings');
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <header className="border-b border-[#21262d] bg-[#161b22] px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-[#f0f6fc]">💪 Training Tracker</h1>
            {selectedSession && !selectedExercise && (
              <Badge variant="outline" className="bg-[#21262d] border-[#30363d] text-[#7d8590]">
                {selectedSession.name} • {selectedSession.type}
              </Badge>
            )}
            {selectedExercise && (
              <Badge variant="outline" className="bg-[#21262d] border-[#30363d] text-[#7d8590]">
                {selectedExercise.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isTimerActive && <WorkoutTimer onComplete={handleTimerComplete} userId={USER_ID} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('settings')}
              className="text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
            >
              ⚙️ Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {currentView === 'sessions' && !selectedExercise && (
          <div className="space-y-6">
            {selectedSession ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Button
                      variant="ghost"
                      onClick={handleBackToSessions}
                      className="mb-2 text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
                    >
                      ← Back to Sessions
                    </Button>
                    <h2 className="text-2xl font-bold text-[#f0f6fc]">{selectedSession.name}</h2>
                    <p className="text-[#7d8590] mt-1">{selectedSession.description}</p>
                  </div>
                  <Badge className="bg-[#238636] text-white hover:bg-[#2ea043]">
                    {selectedSession.type.toUpperCase()}
                  </Badge>
                </div>
                <TrainingSessionList
                  selectedSessionId={selectedSession.id}
                  onExerciseSelect={handleExerciseSelect}
                  userId={USER_ID}
                />
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#f0f6fc] mb-2">Training Sessions</h2>
                  <p className="text-[#7d8590]">Choose a workout to get started</p>
                </div>
                <TrainingSessionList onSessionSelect={handleSessionSelect} />
              </div>
            )}
          </div>
        )}

        {currentView === 'exercise' && selectedExercise && (
          <div>
            <Button
              variant="ghost"
              onClick={handleBackToExercises}
              className="mb-4 text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
            >
              ← Back to Exercises
            </Button>
            <ExerciseView
              exercise={selectedExercise}
              userId={USER_ID}
              onStartTimer={handleStartTimer}
            />
          </div>
        )}

        {currentView === 'metrics' && (
          <BodyMetricsTracker userId={USER_ID} />
        )}

        {currentView === 'settings' && (
          <div>
            <Button
              variant="ghost"
              onClick={() => setCurrentView('sessions')}
              className="mb-4 text-[#7d8590] hover:text-[#e6edf3] hover:bg-[#21262d]"
            >
              ← Back
            </Button>
            <UserSettingsPanel userId={USER_ID} onDarkModeChange={setIsDarkMode} />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161b22] border-t border-[#21262d] px-4 py-3">
        <div className="mx-auto max-w-6xl flex justify-center">
          <Tabs value={currentView} onValueChange={handleViewChange} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-4 bg-[#21262d]">
              <TabsTrigger value="sessions" className="data-[state=active]:bg-[#238636] data-[state=active]:text-white">
                🏋️ Workouts
              </TabsTrigger>
              <TabsTrigger value="exercise" disabled={!selectedExercise} className="data-[state=active]:bg-[#238636] data-[state=active]:text-white">
                💪 Exercise
              </TabsTrigger>
              <TabsTrigger value="metrics" className="data-[state=active]:bg-[#238636] data-[state=active]:text-white">
                📊 Metrics
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#238636] data-[state=active]:text-white">
                ⚙️ Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </nav>

      {/* Bottom spacing for fixed nav */}
      <div className="h-20"></div>
    </div>
  );
}

export default App;
