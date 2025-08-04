import { db } from '../db';
import { trainingSessionsTable, exercisesTable, seriesTable } from '../db/schema';
import { type TrainingSession, type Exercise, type Series } from '../schema';

export interface InitialTrainingData {
    trainingSessions: TrainingSession[];
    exercises: Exercise[];
    series: Series[];
}

export async function initializeTrainingData(): Promise<InitialTrainingData> {
    try {
        // Define training sessions data
        const trainingSessionsData = [
            { name: 'Pull #1', type: 'pull' as const, description: 'Back and biceps focused workout' },
            { name: 'Push #1', type: 'push' as const, description: 'Chest and triceps focused workout' },
            { name: 'Legs #1', type: 'legs' as const, description: 'Quad, glute, and hamstring focused workout' },
            { name: 'Arms & Weak #1', type: 'other' as const, description: 'Arms, shoulders, and core development' },
            { name: 'Pull #2', type: 'pull' as const, description: 'Back and biceps variety workout' },
            { name: 'Push #2', type: 'push' as const, description: 'Shoulders, chest, and triceps variety workout' },
            { name: 'Legs #2', type: 'legs' as const, description: 'Hamstring, quad, and calf variety workout' },
            { name: 'Arms & Weak #2', type: 'other' as const, description: 'Arms and core variety workout' }
        ];

        // Insert training sessions
        const trainingSessions = await db.insert(trainingSessionsTable)
            .values(trainingSessionsData)
            .returning()
            .execute();

        // Define predefined exercises data based on the JSON structure
        const predefinedExercisesData = {
            "Pull #1": {
                "Neutral grip pull up": { sets: 3, reps: "10 - 12" },
                "RDL": { sets: 2, reps: "8" },
                "Chest Supported Machine Row": { sets: 3, reps: "8 - 10" },
                "Lat Prayer": { sets: 3, reps: "12 - 15" },
                "Preacher Curl": { sets: 3, reps: "10 - 12" },
                "Face Pull": { sets: 3, reps: "10 - 12" }
            },
            "Push #1": {
                "Lateral Raise": { sets: 3, reps: "10 - 12" },
                "Incline Bench Press": { sets: 4, reps: "8 - 10" },
                "Pec Deck (with partials)": { sets: 3, reps: "12 - 15" },
                "Overhead Tricep Extension": { sets: 3, reps: "8" },
                "Tricep Pressdown (bar)": { sets: 2, reps: "8 - 10" },
                "Cable Crunch": { sets: 3, reps: "10 - 12" }
            },
            "Legs #1": {
                "Seated Leg Curl": { sets: 3, reps: "8 - 10" },
                "Hip Adduction": { sets: 3, reps: "10 - 12" },
                "Front Squat": { sets: 3, reps: "4/6/8" },
                "Leg Extension": { sets: 3, reps: "10 - 12" },
                "Leg Press Calf Press": { sets: 3, reps: "12 - 15" }
            },
            "Arms & Weak #1": {
                "Lateral Raise": { sets: 3, reps: "8 - 12" },
                "Dumbbell Incline Curl": { sets: 3, reps: "10 - 12" },
                "Seated French Press": { sets: 3, reps: "10" },
                "Bottom 2/3 Peacher Curl": { sets: 2, reps: "12 - 15" },
                "Cable Triceps Kickback": { sets: 2, reps: "12 - 15" },
                "Leg Raise": { sets: 3, reps: "10 - 20" }
            },
            "Pull #2": {
                "Cable Row": { sets: 3, reps: "10 - 12" },
                "Arms 45° Hyperextension": { sets: 2, reps: "10 - 20" },
                "Lat Pulldown": { sets: 3, reps: "10 - 12" },
                "Zottman Curl": { sets: 3, reps: "10 - 12" },
                "Reverse Flye": { sets: 3, reps: "5,4,3+ each" },
                "DB Shrug-In": { sets: 3, reps: "10 - 12" }
            },
            "Push #2": {
                "Machine Shoulder Press": { sets: 3, reps: "10 - 12" },
                "Lateral Raise": { sets: 3, reps: "10 - 12" },
                "Decline DB Press": { sets: 3, reps: "8 - 10" },
                "Low Incline DB Flye": { sets: 2, reps: "15-20" },
                "Katana Triceps Extension": { sets: 3, reps: "10 - 12" },
                "Ab Wheel Rollout": { sets: 3, reps: "10 - 20" }
            },
            "Legs #2": {
                "Lying Leg Curl": { sets: 3, reps: "8 - 10" },
                "Leg Press": { sets: 3, reps: "8" },
                "Barbell Lunge": { sets: 2, reps: "8" },
                "Hip Adduction": { sets: 3, reps: "10 - 12" },
                "Sissy Squat": { sets: 3, reps: "10 - 12" },
                "Calf Raise": { sets: 3, reps: "10 - 12" }
            },
            "Arms & Weak #2": {
                "Lateral Raise": { sets: 3, reps: "8 - 12" },
                "Ez Skull Crusher": { sets: 3, reps: "10 - 12" },
                "Spider Curl": { sets: 3, reps: "10 - 12" },
                "Tricep Pressdown Long Rope": { sets: 2, reps: "12 - 15" },
                "Incline DB Stretch Curl": { sets: 2, reps: "12 - 15" },
                "Cable Crunch": { sets: 3, reps: "10 - 12" }
            }
        };

        // Function to parse repetitions according to the rules
        const parseReps = (repsStr: string): number => {
            // For ranges like "10 - 12", use the lower bound
            if (repsStr.includes(' - ')) {
                return parseInt(repsStr.split(' - ')[0]);
            }
            // For ranges like "15-20", use the lower bound
            if (repsStr.includes('-') && !repsStr.includes(' ')) {
                return parseInt(repsStr.split('-')[0]);
            }
            // For sequences like "4/6/8", use the first number
            if (repsStr.includes('/')) {
                return parseInt(repsStr.split('/')[0]);
            }
            // For "5,4,3+ each", use the first number
            if (repsStr.includes(',')) {
                return parseInt(repsStr.split(',')[0]);
            }
            // For single numbers like "8", use that number
            return parseInt(repsStr);
        };

        // Build exercises data from predefined structure
        const exercisesData = [];
        for (const trainingSession of trainingSessions) {
            const sessionExercises = predefinedExercisesData[trainingSession.name as keyof typeof predefinedExercisesData];
            if (sessionExercises) {
                for (const [exerciseName, exerciseData] of Object.entries(sessionExercises)) {
                    exercisesData.push({
                        training_session_id: trainingSession.id,
                        name: exerciseName,
                        description: '', // Empty string as specified
                        target_series: exerciseData.sets
                    });
                }
            }
        }

        // Insert exercises
        const exercises = await db.insert(exercisesTable)
            .values(exercisesData)
            .returning()
            .execute();

        // Build series data
        const seriesData = [];
        for (const exercise of exercises) {
            // Find the corresponding training session and exercise data
            const trainingSession = trainingSessions.find(ts => ts.id === exercise.training_session_id);
            if (trainingSession) {
                const sessionExercises = predefinedExercisesData[trainingSession.name as keyof typeof predefinedExercisesData];
                if (sessionExercises) {
                    const exerciseInfo = (sessionExercises as any)[exercise.name];
                    if (exerciseInfo && exerciseInfo.reps) {
                        const targetReps = parseReps(exerciseInfo.reps);
                        
                        for (let seriesNum = 1; seriesNum <= exercise.target_series; seriesNum++) {
                            seriesData.push({
                                exercise_id: exercise.id,
                                series_number: seriesNum,
                                target_repetitions: targetReps,
                                target_weight: 0 // Default target weight as specified
                            });
                        }
                    }
                }
            }
        }

        // Insert series
        const seriesResults = await db.insert(seriesTable)
            .values(seriesData)
            .returning()
            .execute();

        // Convert numeric fields back to numbers for return
        const series = seriesResults.map(s => ({
            ...s,
            target_weight: parseFloat(s.target_weight.toString())
        }));

        return {
            trainingSessions,
            exercises,
            series
        };
    } catch (error) {
        console.error('Training data initialization failed:', error);
        throw error;
    }
}