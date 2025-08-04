
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userExerciseLogsTable, trainingSessionsTable, exercisesTable } from '../db/schema';
import { type CreateUserExerciseLogInput } from '../schema';
import { createUserExerciseLog } from '../handlers/create_user_exercise_log';
import { eq } from 'drizzle-orm';

describe('createUserExerciseLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let exerciseId: number;

  beforeEach(async () => {
    // Create prerequisite training session
    const trainingSession = await db.insert(trainingSessionsTable)
      .values({
        name: 'Test Session',
        type: 'push',
        description: 'Test training session'
      })
      .returning()
      .execute();

    // Create prerequisite exercise
    const exercise = await db.insert(exercisesTable)
      .values({
        training_session_id: trainingSession[0].id,
        name: 'Test Exercise',
        description: 'Test exercise',
        target_series: 3
      })
      .returning()
      .execute();

    exerciseId = exercise[0].id;
  });

  const testInput: CreateUserExerciseLogInput = {
    user_id: 'test_user_123',
    exercise_id: 0, // Will be set in tests
    series_number: 2,
    repetitions: 12,
    weight: 50.5,
    completed_at: new Date('2024-01-15T10:30:00Z')
  };

  it('should create a user exercise log', async () => {
    const input = { ...testInput, exercise_id: exerciseId };
    const result = await createUserExerciseLog(input);

    // Basic field validation
    expect(result.user_id).toEqual('test_user_123');
    expect(result.exercise_id).toEqual(exerciseId);
    expect(result.series_number).toEqual(2);
    expect(result.repetitions).toEqual(12);
    expect(result.weight).toEqual(50.5);
    expect(typeof result.weight).toBe('number');
    expect(result.completed_at).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user exercise log to database', async () => {
    const input = { ...testInput, exercise_id: exerciseId };
    const result = await createUserExerciseLog(input);

    // Query using proper drizzle syntax
    const logs = await db.select()
      .from(userExerciseLogsTable)
      .where(eq(userExerciseLogsTable.id, result.id))
      .execute();

    expect(logs).toHaveLength(1);
    expect(logs[0].user_id).toEqual('test_user_123');
    expect(logs[0].exercise_id).toEqual(exerciseId);
    expect(logs[0].series_number).toEqual(2);
    expect(logs[0].repetitions).toEqual(12);
    expect(logs[0].weight).toEqual(50.5); // real column - already a number
    expect(logs[0].completed_at).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(logs[0].created_at).toBeInstanceOf(Date);
  });

  it('should use current time when completed_at is not provided', async () => {
    const inputWithoutCompletedAt = {
      user_id: 'test_user_123',
      exercise_id: exerciseId,
      series_number: 1,
      repetitions: 10,
      weight: 45.0
    };

    const result = await createUserExerciseLog(inputWithoutCompletedAt);

    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at.getTime()).toBeCloseTo(Date.now(), -2); // Within 100ms
  });

  it('should throw error when exercise does not exist', async () => {
    const input = { ...testInput, exercise_id: 99999 };

    await expect(createUserExerciseLog(input)).rejects.toThrow(/Exercise with id 99999 does not exist/i);
  });

  it('should handle different weight values correctly', async () => {
    const testCases = [
      { weight: 25.75, expected: 25.75 },
      { weight: 100, expected: 100 },
      { weight: 0.5, expected: 0.5 }
    ];

    for (const testCase of testCases) {
      const input = { 
        ...testInput, 
        exercise_id: exerciseId,
        weight: testCase.weight,
        series_number: testCases.indexOf(testCase) + 1 // Unique series numbers
      };
      
      const result = await createUserExerciseLog(input);
      expect(result.weight).toEqual(testCase.expected);
      expect(typeof result.weight).toBe('number');
    }
  });
});
