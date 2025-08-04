
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainingSessionsTable } from '../db/schema';
import { getTrainingSessions } from '../handlers/get_training_sessions';

describe('getTrainingSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no training sessions exist', async () => {
    const result = await getTrainingSessions();
    expect(result).toEqual([]);
  });

  it('should return all training sessions', async () => {
    // Create test training sessions
    await db.insert(trainingSessionsTable)
      .values([
        {
          name: 'Pull Day A',
          type: 'pull',
          description: 'Back and biceps workout'
        },
        {
          name: 'Push Day A',
          type: 'push',
          description: 'Chest, shoulders and triceps workout'
        },
        {
          name: 'Legs Day A',
          type: 'legs',
          description: 'Quadriceps, hamstrings and glutes workout'
        }
      ])
      .execute();

    const result = await getTrainingSessions();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Pull Day A');
    expect(result[0].type).toEqual('pull');
    expect(result[0].description).toEqual('Back and biceps workout');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Push Day A');
    expect(result[1].type).toEqual('push');
    expect(result[2].name).toEqual('Legs Day A');
    expect(result[2].type).toEqual('legs');
  });

  it('should return sessions with all training types', async () => {
    // Create sessions with all possible training types
    await db.insert(trainingSessionsTable)
      .values([
        {
          name: 'Pull Session',
          type: 'pull',
          description: 'Pull workout'
        },
        {
          name: 'Push Session',
          type: 'push',
          description: 'Push workout'
        },
        {
          name: 'Legs Session',
          type: 'legs',
          description: 'Legs workout'
        },
        {
          name: 'Other Session',
          type: 'other',
          description: 'Other workout'
        }
      ])
      .execute();

    const result = await getTrainingSessions();

    expect(result).toHaveLength(4);
    
    const types = result.map(session => session.type);
    expect(types).toContain('pull');
    expect(types).toContain('push');
    expect(types).toContain('legs');
    expect(types).toContain('other');
  });

  it('should handle sessions with null descriptions', async () => {
    await db.insert(trainingSessionsTable)
      .values({
        name: 'Simple Session',
        type: 'pull',
        description: null
      })
      .execute();

    const result = await getTrainingSessions();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Simple Session');
    expect(result[0].description).toBeNull();
  });
});
