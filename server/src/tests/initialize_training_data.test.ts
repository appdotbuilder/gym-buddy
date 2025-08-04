
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainingSessionsTable, exercisesTable, seriesTable } from '../db/schema';
import { initializeTrainingData } from '../handlers/initialize_training_data';
import { eq, count } from 'drizzle-orm';

describe('initializeTrainingData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create 8 training sessions', async () => {
    const result = await initializeTrainingData();

    expect(result.trainingSessions).toHaveLength(8);
    
    // Verify session types
    const pullSessions = result.trainingSessions.filter(s => s.type === 'pull');
    const pushSessions = result.trainingSessions.filter(s => s.type === 'push');
    const legsSessions = result.trainingSessions.filter(s => s.type === 'legs');
    const otherSessions = result.trainingSessions.filter(s => s.type === 'other');

    expect(pullSessions).toHaveLength(2);
    expect(pushSessions).toHaveLength(2);
    expect(legsSessions).toHaveLength(2);
    expect(otherSessions).toHaveLength(2);

    // Verify all sessions have required fields
    result.trainingSessions.forEach(session => {
      expect(session.id).toBeDefined();
      expect(session.name).toBeDefined();
      expect(session.type).toBeDefined();
      expect(session.created_at).toBeInstanceOf(Date);
    });
  });

  it('should create exercises for each training session', async () => {
    const result = await initializeTrainingData();

    expect(result.exercises.length).toBeGreaterThan(0);

    // Verify each exercise has valid fields
    result.exercises.forEach(exercise => {
      expect(exercise.id).toBeDefined();
      expect(exercise.training_session_id).toBeDefined();
      expect(exercise.name).toBeDefined();
      expect(exercise.target_series).toBeGreaterThanOrEqual(2);
      expect(exercise.target_series).toBeLessThanOrEqual(4);
      expect(exercise.created_at).toBeInstanceOf(Date);
    });

    // Verify each training session has exercises
    for (const session of result.trainingSessions) {
      const sessionExercises = result.exercises.filter(e => e.training_session_id === session.id);
      expect(sessionExercises.length).toBeGreaterThan(0);
    }
  });

  it('should create series for each exercise', async () => {
    const result = await initializeTrainingData();

    expect(result.series.length).toBeGreaterThan(0);

    // Verify series data
    result.series.forEach(series => {
      expect(series.id).toBeDefined();
      expect(series.exercise_id).toBeDefined();
      expect(series.series_number).toBeGreaterThanOrEqual(1);
      expect(series.series_number).toBeLessThanOrEqual(4);
      expect(series.target_repetitions).toBeGreaterThan(0);
      expect(series.target_weight).toBeGreaterThanOrEqual(0);
      expect(typeof series.target_weight).toBe('number');
      expect(series.created_at).toBeInstanceOf(Date);
    });

    // Verify each exercise has correct number of series
    for (const exercise of result.exercises) {
      const exerciseSeries = result.series.filter(s => s.exercise_id === exercise.id);
      expect(exerciseSeries).toHaveLength(exercise.target_series);

      // Verify series numbers are sequential
      const seriesNumbers = exerciseSeries.map(s => s.series_number).sort();
      for (let i = 0; i < seriesNumbers.length; i++) {
        expect(seriesNumbers[i]).toBe(i + 1);
      }
    }
  });

  it('should save all data to database', async () => {
    await initializeTrainingData();

    // Check training sessions in database
    const sessionsCount = await db.select({ count: count() })
      .from(trainingSessionsTable)
      .execute();
    expect(sessionsCount[0].count).toBe(8);

    // Check exercises in database
    const exercisesCount = await db.select({ count: count() })
      .from(exercisesTable)
      .execute();
    expect(exercisesCount[0].count).toBeGreaterThan(0);

    // Check series in database
    const seriesCount = await db.select({ count: count() })
      .from(seriesTable)
      .execute();
    expect(seriesCount[0].count).toBeGreaterThan(0);
  });

  it('should handle different exercise types with appropriate rep/weight schemes', async () => {
    const result = await initializeTrainingData();

    // All exercises should have 0 as default target weight as per specification
    result.series.forEach(series => {
      expect(series.target_weight).toBe(0);
    });

    // Check that repetitions are parsed correctly according to rules
    // Find exercises with range reps like "10 - 12" - should use lower bound (10)
    const lateralRaiseExercise = result.exercises.find(e => e.name === 'Lateral Raise');
    if (lateralRaiseExercise) {
      const lateralRaiseSeries = result.series.filter(s => s.exercise_id === lateralRaiseExercise.id);
      lateralRaiseSeries.forEach(series => {
        expect(series.target_repetitions).toBe(10); // Should be 10 (lower bound of "10 - 12")
      });
    }

    // Find exercises with single number reps like "8" - should use that number
    const rdlExercise = result.exercises.find(e => e.name === 'RDL');
    if (rdlExercise) {
      const rdlSeries = result.series.filter(s => s.exercise_id === rdlExercise.id);
      rdlSeries.forEach(series => {
        expect(series.target_repetitions).toBe(8); // Should be 8
      });
    }

    // Find exercises with sequence reps like "4/6/8" - should use first number (4)
    const frontSquatExercise = result.exercises.find(e => e.name === 'Front Squat');
    if (frontSquatExercise) {
      const frontSquatSeries = result.series.filter(s => s.exercise_id === frontSquatExercise.id);
      frontSquatSeries.forEach(series => {
        expect(series.target_repetitions).toBe(4); // Should be 4 (first number of "4/6/8")
      });
    }
  });

  it('should create specific named training sessions', async () => {
    const result = await initializeTrainingData();

    const sessionNames = result.trainingSessions.map(s => s.name);
    
    // Verify specific session names exist
    expect(sessionNames).toContain('Pull #1');
    expect(sessionNames).toContain('Pull #2');
    expect(sessionNames).toContain('Push #1');
    expect(sessionNames).toContain('Push #2');
    expect(sessionNames).toContain('Legs #1');
    expect(sessionNames).toContain('Legs #2');
    expect(sessionNames).toContain('Arms & Weak #1');
    expect(sessionNames).toContain('Arms & Weak #2');
  });
});
