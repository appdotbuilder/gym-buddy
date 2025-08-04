
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bodyMetricsTable } from '../db/schema';
import { type GetBodyMetricsInput, type CreateBodyMetricInput } from '../schema';
import { getBodyMetrics } from '../handlers/get_body_metrics';

// Helper function to create test data
const createTestBodyMetric = async (data: CreateBodyMetricInput) => {
  const result = await db.insert(bodyMetricsTable)
    .values({
      user_id: data.user_id,
      metric_type: data.metric_type,
      value: data.value, // Pass number directly, no conversion needed for insert
      unit: data.unit,
      recorded_at: data.recorded_at || new Date(),
    })
    .returning()
    .execute();

  return {
    ...result[0],
    value: parseFloat(result[0].value.toString())
  };
};

describe('getBodyMetrics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no metrics exist', async () => {
    const input: GetBodyMetricsInput = {
      user_id: 'user123',
      limit: 50,
      offset: 0
    };

    const result = await getBodyMetrics(input);

    expect(result).toEqual([]);
  });

  it('should return user body metrics', async () => {
    // Create test data
    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'weight',
      value: 75.5,
      unit: 'kg'
    });

    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'waist',
      value: 85.0,
      unit: 'cm'
    });

    const input: GetBodyMetricsInput = {
      user_id: 'user123',
      limit: 50,
      offset: 0
    };

    const result = await getBodyMetrics(input);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual('user123');
    expect(result[1].user_id).toEqual('user123');
    expect(typeof result[0].value).toBe('number');
    expect(typeof result[1].value).toBe('number');
  });

  it('should filter by metric type', async () => {
    // Create test data with different metric types
    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'weight',
      value: 75.5,
      unit: 'kg'
    });

    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'waist',
      value: 85.0,
      unit: 'cm'
    });

    const input: GetBodyMetricsInput = {
      user_id: 'user123',
      metric_type: 'weight',
      limit: 50,
      offset: 0
    };

    const result = await getBodyMetrics(input);

    expect(result).toHaveLength(1);
    expect(result[0].metric_type).toEqual('weight');
    expect(result[0].value).toEqual(75.5);
    expect(result[0].unit).toEqual('kg');
  });

  it('should only return metrics for specified user', async () => {
    // Create metrics for different users
    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'weight',
      value: 75.5,
      unit: 'kg'
    });

    await createTestBodyMetric({
      user_id: 'user456',
      metric_type: 'weight',
      value: 80.0,
      unit: 'kg'
    });

    const input: GetBodyMetricsInput = {
      user_id: 'user123',
      limit: 50,
      offset: 0
    };

    const result = await getBodyMetrics(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user123');
    expect(result[0].value).toEqual(75.5);
  });

  it('should respect pagination limits', async () => {
    // Create multiple metrics
    for (let i = 0; i < 5; i++) {
      await createTestBodyMetric({
        user_id: 'user123',
        metric_type: 'weight',
        value: 70 + i,
        unit: 'kg'
      });
    }

    const input: GetBodyMetricsInput = {
      user_id: 'user123',
      limit: 3,
      offset: 0
    };

    const result = await getBodyMetrics(input);

    expect(result).toHaveLength(3);
  });

  it('should respect pagination offset', async () => {
    // Create multiple metrics with different recorded times
    const baseDate = new Date('2024-01-01');
    for (let i = 0; i < 5; i++) {
      const recordedAt = new Date(baseDate);
      recordedAt.setDate(baseDate.getDate() + i);
      
      await createTestBodyMetric({
        user_id: 'user123',
        metric_type: 'weight',
        value: 70 + i,
        unit: 'kg',
        recorded_at: recordedAt
      });
    }

    // Get first page
    const firstPage = await getBodyMetrics({
      user_id: 'user123',
      limit: 2,
      offset: 0
    });

    // Get second page
    const secondPage = await getBodyMetrics({
      user_id: 'user123',
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(2);
    
    // Should be different records
    expect(firstPage[0].id).not.toEqual(secondPage[0].id);
    expect(firstPage[1].id).not.toEqual(secondPage[1].id);
  });

  it('should order results by recorded_at descending', async () => {
    const olderDate = new Date('2024-01-01');
    const newerDate = new Date('2024-01-02');

    // Create metrics with specific dates
    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'weight',
      value: 75.0,
      unit: 'kg',
      recorded_at: olderDate
    });

    await createTestBodyMetric({
      user_id: 'user123',
      metric_type: 'weight',
      value: 76.0,
      unit: 'kg',
      recorded_at: newerDate
    });

    const result = await getBodyMetrics({
      user_id: 'user123',
      limit: 50,
      offset: 0
    });

    expect(result).toHaveLength(2);
    // First result should be the newer one (descending order)
    expect(result[0].value).toEqual(76.0);
    expect(result[0].recorded_at).toEqual(newerDate);
    expect(result[1].value).toEqual(75.0);
    expect(result[1].recorded_at).toEqual(olderDate);
  });
});
