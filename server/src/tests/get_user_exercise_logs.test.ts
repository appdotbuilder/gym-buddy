
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainingSessionsTable, exercisesTable, userExerciseLogsTable } from '../db/schema';
import { type GetUserExerciseLogsInput } from '../schema';
import { getUserExerciseLogs } from '../handlers/get_user_exercise_logs';

const testUserId = 'test-user-123';
const otherUserId = 'other-user-456';

const testInput: GetUserExerciseLogsInput = {
  user_id: testUserId,
  limit: 50,
  offset: 0
};

describe('getUserExerciseLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no logs exist', async () => {
    const result = await getUserExerciseLogs(testInput);
    expect(result).toEqual([]);
  });

  it('should return user exercise logs ordered by completion date', async () => {
    // Create training session
    const [session] = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create exercise
    const [exercise] = await db.insert(exercisesTable)
      .values({
        training_session_id: session.id,
        name: 'Bench Press',
        description: 'Chest exercise',
        target_series: 3
      })
      .returning()
      .execute();

    // Create exercise logs with different completion times
    const now = new Date();
    const earlier = new Date(now.getTime() - 3600000); // 1 hour earlier

    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: testUserId,
          exercise_id: exercise.id,
          series_number: 1,
          repetitions: 10,
          weight: 80.5, // Pass as number - Drizzle handles conversion
          completed_at: earlier
        },
        {
          user_id: testUserId,
          exercise_id: exercise.id,
          series_number: 2,
          repetitions: 8,
          weight: 82.5, // Pass as number
          completed_at: now
        }
      ])
      .execute();

    const result = await getUserExerciseLogs(testInput);

    expect(result).toHaveLength(2);
    
    // Should be ordered by completed_at descending (most recent first)
    expect(result[0].repetitions).toEqual(8);
    expect(result[0].weight).toEqual(82.5);
    expect(typeof result[0].weight).toBe('number');
    expect(result[0].completed_at.getTime()).toBeGreaterThan(result[1].completed_at.getTime());

    expect(result[1].repetitions).toEqual(10);
    expect(result[1].weight).toEqual(80.5);
    expect(typeof result[1].weight).toBe('number');
  });

  it('should filter by exercise_id when provided', async () => {
    // Create training session
    const [session] = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test description'
      })
      .returning()
      .execute();

    // Create two exercises
    const [exercise1] = await db.insert(exercisesTable)
      .values({
        training_session_id: session.id,
        name: 'Bench Press',
        description: 'Chest exercise',
        target_series: 3
      })
      .returning()
      .execute();

    const [exercise2] = await db.insert(exercisesTable)
      .values({
        training_session_id: session.id,
        name: 'Push Ups',
        description: 'Bodyweight exercise',
        target_series: 3
      })
      .returning()
      .execute();

    // Create logs for both exercises
    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: testUserId,
          exercise_id: exercise1.id,
          series_number: 1,
          repetitions: 10,
          weight: 80.0 // Pass as number
        },
        {
          user_id: testUserId,
          exercise_id: exercise2.id,
          series_number: 1,
          repetitions: 15,
          weight: 0.0 // Pass as number
        }
      ])
      .execute();

    // Filter by exercise1
    const result = await getUserExerciseLogs({
      ...testInput,
      exercise_id: exercise1.id
    });

    expect(result).toHaveLength(1);
    expect(result[0].exercise_id).toEqual(exercise1.id);
    expect(result[0].repetitions).toEqual(10);
    expect(result[0].weight).toEqual(80.0);
  });

  it('should only return logs for specified user', async () => {
    // Create training session and exercise
    const [session] = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [exercise] = await db.insert(exercisesTable)
      .values({
        training_session_id: session.id,
        name: 'Bench Press',
        description: 'Chest exercise',
        target_series: 3
      })
      .returning()
      .execute();

    // Create logs for different users
    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: testUserId,
          exercise_id: exercise.id,
          series_number: 1,
          repetitions: 10,
          weight: 80.0 // Pass as number
        },
        {
          user_id: otherUserId,
          exercise_id: exercise.id,
          series_number: 1,
          repetitions: 12,
          weight: 85.0 // Pass as number
        }
      ])
      .execute();

    const result = await getUserExerciseLogs(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].repetitions).toEqual(10);
  });

  it('should apply pagination correctly', async () => {
    // Create training session and exercise
    const [session] = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [exercise] = await db.insert(exercisesTable)
      .values({
        training_session_id: session.id,
        name: 'Bench Press',
        description: 'Chest exercise',
        target_series: 3
      })
      .returning()
      .execute();

    // Create multiple logs
    const logs = Array.from({ length: 5 }, (_, i) => ({
      user_id: testUserId,
      exercise_id: exercise.id,
      series_number: 1,
      repetitions: 10 + i,
      weight: 80 + i // Pass as number
    }));

    await db.insert(userExerciseLogsTable)
      .values(logs)
      .execute();

    // Test pagination
    const firstPage = await getUserExerciseLogs({
      ...testInput,
      limit: 2,
      offset: 0
    });

    const secondPage = await getUserExerciseLogs({
      ...testInput,
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);
    
    // Should not have overlapping results
    const firstPageIds = firstPage.map(log => log.id);
    const secondPageIds = secondPage.map(log => log.id);
    expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
  });

  it('should handle all required fields correctly', async () => {
    // Create training session and exercise
    const [session] = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'legs',
        description: 'Test description'
      })
      .returning()
      .execute();

    const [exercise] = await db.insert(exercisesTable)
      .values({
        training_session_id: session.id,
        name: 'Squats',
        description: 'Leg exercise',
        target_series: 4
      })
      .returning()
      .execute();

    const specificTime = new Date('2024-01-15T10:30:00Z');

    await db.insert(userExerciseLogsTable)
      .values({
        user_id: testUserId,
        exercise_id: exercise.id,
        series_number: 3,
        repetitions: 12,
        weight: 100.25, // Pass as number
        completed_at: specificTime
      })
      .execute();

    const result = await getUserExerciseLogs(testInput);

    expect(result).toHaveLength(1);
    
    const log = result[0];
    expect(log.id).toBeDefined();
    expect(log.user_id).toEqual(testUserId);
    expect(log.exercise_id).toEqual(exercise.id);
    expect(log.series_number).toEqual(3);
    expect(log.repetitions).toEqual(12);
    expect(log.weight).toEqual(100.25);
    expect(typeof log.weight).toBe('number');
    expect(log.completed_at).toBeInstanceOf(Date);
    expect(log.created_at).toBeInstanceOf(Date);
  });
});
