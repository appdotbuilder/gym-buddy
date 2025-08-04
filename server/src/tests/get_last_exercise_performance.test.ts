
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainingSessionsTable, exercisesTable, userExerciseLogsTable } from '../db/schema';
import { getLastExercisePerformance } from '../handlers/get_last_exercise_performance';

describe('getLastExercisePerformance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no previous performance exists', async () => {
    const result = await getLastExercisePerformance('user1', 999);
    expect(result).toEqual([]);
  });

  it('should return the most recent exercise performance for a user', async () => {
    // Create training session
    const sessionResult = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test session'
      })
      .returning()
      .execute();

    // Create exercise
    const exerciseResult = await db.insert(exercisesTable)
      .values({
        training_session_id: sessionResult[0].id,
        name: 'Bench Press',
        description: 'Chest exercise',
        target_series: 3
      })
      .returning()
      .execute();

    const exerciseId = exerciseResult[0].id;

    // Create older performance logs (3 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 3);

    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: 'user1',
          exercise_id: exerciseId,
          series_number: 1,
          repetitions: 8,
          weight: 60.0,
          completed_at: oldDate
        },
        {
          user_id: 'user1',
          exercise_id: exerciseId,
          series_number: 2,
          repetitions: 6,
          weight: 60.0,
          completed_at: oldDate
        }
      ])
      .execute();

    // Create newer performance logs (1 day ago)
    const newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);

    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: 'user1',
          exercise_id: exerciseId,
          series_number: 1,
          repetitions: 10,
          weight: 65.0,
          completed_at: newDate
        },
        {
          user_id: 'user1',
          exercise_id: exerciseId,
          series_number: 2,
          repetitions: 8,
          weight: 65.0,
          completed_at: newDate
        },
        {
          user_id: 'user1',
          exercise_id: exerciseId,
          series_number: 3,
          repetitions: 6,
          weight: 65.0,
          completed_at: newDate
        }
      ])
      .execute();

    const result = await getLastExercisePerformance('user1', exerciseId);

    // Should return only the most recent session (3 series)
    expect(result).toHaveLength(3);
    
    // Verify it's ordered by series_number
    expect(result[0].series_number).toBe(1);
    expect(result[1].series_number).toBe(2);
    expect(result[2].series_number).toBe(3);

    // Verify it's the newer performance data
    expect(result[0].repetitions).toBe(10);
    expect(result[0].weight).toBe(65.0);
    expect(typeof result[0].weight).toBe('number');
    
    // Verify completed_at is from the newer session
    expect(result[0].completed_at).toEqual(newDate);
  });

  it('should return performance only for the specified user', async () => {
    // Create training session and exercise
    const sessionResult = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test session'
      })
      .returning()
      .execute();

    const exerciseResult = await db.insert(exercisesTable)
      .values({
        training_session_id: sessionResult[0].id,
        name: 'Bench Press',
        description: 'Chest exercise',
        target_series: 2
      })
      .returning()
      .execute();

    const exerciseId = exerciseResult[0].id;
    const sameDate = new Date();

    // Create logs for different users at the same time
    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: 'user1',
          exercise_id: exerciseId,
          series_number: 1,
          repetitions: 10,
          weight: 70.0,
          completed_at: sameDate
        },
        {
          user_id: 'user2',
          exercise_id: exerciseId,
          series_number: 1,
          repetitions: 12,
          weight: 80.0,
          completed_at: sameDate
        }
      ])
      .execute();

    const result = await getLastExercisePerformance('user1', exerciseId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('user1');
    expect(result[0].weight).toBe(70.0);
  });

  it('should return performance only for the specified exercise', async () => {
    // Create training session
    const sessionResult = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test session'
      })
      .returning()
      .execute();

    // Create two different exercises
    const exerciseResults = await db.insert(exercisesTable)
      .values([
        {
          training_session_id: sessionResult[0].id,
          name: 'Bench Press',
          description: 'Chest exercise',
          target_series: 2
        },
        {
          training_session_id: sessionResult[0].id,
          name: 'Squat',
          description: 'Leg exercise',
          target_series: 2
        }
      ])
      .returning()
      .execute();

    const exerciseId1 = exerciseResults[0].id;
    const exerciseId2 = exerciseResults[1].id;
    const sameDate = new Date();

    // Create logs for different exercises
    await db.insert(userExerciseLogsTable)
      .values([
        {
          user_id: 'user1',
          exercise_id: exerciseId1,
          series_number: 1,
          repetitions: 10,
          weight: 70.0,
          completed_at: sameDate
        },
        {
          user_id: 'user1',
          exercise_id: exerciseId2,
          series_number: 1,
          repetitions: 15,
          weight: 100.0,
          completed_at: sameDate
        }
      ])
      .execute();

    const result = await getLastExercisePerformance('user1', exerciseId1);

    expect(result).toHaveLength(1);
    expect(result[0].exercise_id).toBe(exerciseId1);
    expect(result[0].weight).toBe(70.0);
  });
});
