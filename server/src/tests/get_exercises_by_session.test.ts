
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainingSessionsTable, exercisesTable } from '../db/schema';
import { getExercisesBySession } from '../handlers/get_exercises_by_session';

describe('getExercisesBySession', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return exercises for a specific training session', async () => {
    // Create a training session
    const sessionResult = await db.insert(trainingSessionsTable)
      .values({
        name: 'Upper Body Workout',
        type: 'push',
        description: 'Chest and shoulders workout'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create exercises for this session
    const exerciseResults = await db.insert(exercisesTable)
      .values([
        {
          training_session_id: sessionId,
          name: 'Bench Press',
          description: 'Chest exercise',
          target_series: 3
        },
        {
          training_session_id: sessionId,
          name: 'Shoulder Press',
          description: 'Shoulder exercise',
          target_series: 3
        }
      ])
      .returning()
      .execute();

    // Test the handler
    const result = await getExercisesBySession(sessionId);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Bench Press');
    expect(result[0].training_session_id).toEqual(sessionId);
    expect(result[0].target_series).toEqual(3);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Shoulder Press');
    expect(result[1].training_session_id).toEqual(sessionId);
    expect(result[1].target_series).toEqual(3);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent training session', async () => {
    const result = await getExercisesBySession(999);

    expect(result).toHaveLength(0);
  });

  it('should return only exercises for the specified session', async () => {
    // Create two training sessions
    const session1Result = await db.insert(trainingSessionsTable)
      .values({
        name: 'Push Workout',
        type: 'push',
        description: 'Upper body push'
      })
      .returning()
      .execute();

    const session2Result = await db.insert(trainingSessionsTable)
      .values({
        name: 'Pull Workout',
        type: 'pull',
        description: 'Upper body pull'
      })
      .returning()
      .execute();

    const session1Id = session1Result[0].id;
    const session2Id = session2Result[0].id;

    // Create exercises for both sessions
    await db.insert(exercisesTable)
      .values([
        {
          training_session_id: session1Id,
          name: 'Push Exercise 1',
          description: 'First push exercise',
          target_series: 3
        },
        {
          training_session_id: session1Id,
          name: 'Push Exercise 2',
          description: 'Second push exercise',
          target_series: 4
        },
        {
          training_session_id: session2Id,
          name: 'Pull Exercise 1',
          description: 'First pull exercise',
          target_series: 3
        }
      ])
      .execute();

    // Test that only session1 exercises are returned
    const result = await getExercisesBySession(session1Id);

    expect(result).toHaveLength(2);
    expect(result.every(exercise => exercise.training_session_id === session1Id)).toBe(true);
    expect(result.map(ex => ex.name)).toEqual(['Push Exercise 1', 'Push Exercise 2']);
  });

  it('should return exercises with all required fields', async () => {
    // Create a training session
    const sessionResult = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'legs',
        description: 'Leg workout'
      })
      .returning()
      .execute();

    const sessionId = sessionResult[0].id;

    // Create an exercise
    await db.insert(exercisesTable)
      .values({
        training_session_id: sessionId,
        name: 'Squat',
        description: 'Compound leg exercise',
        target_series: 4
      })
      .execute();

    const result = await getExercisesBySession(sessionId);

    expect(result).toHaveLength(1);
    const exercise = result[0];

    // Verify all required fields exist
    expect(exercise.id).toBeDefined();
    expect(typeof exercise.id).toBe('number');
    expect(exercise.training_session_id).toEqual(sessionId);
    expect(exercise.name).toEqual('Squat');
    expect(exercise.description).toEqual('Compound leg exercise');
    expect(exercise.target_series).toEqual(4);
    expect(exercise.created_at).toBeInstanceOf(Date);
  });
});
