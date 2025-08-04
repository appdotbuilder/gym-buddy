
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bodyMetricsTable } from '../db/schema';
import { type CreateBodyMetricInput } from '../schema';
import { createBodyMetric } from '../handlers/create_body_metric';
import { eq } from 'drizzle-orm';

// Test input for weight measurement
const testInput: CreateBodyMetricInput = {
  user_id: 'user123',
  metric_type: 'weight',
  value: 75.5,
  unit: 'kg'
};

describe('createBodyMetric', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a body metric', async () => {
    const result = await createBodyMetric(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('user123');
    expect(result.metric_type).toEqual('weight');
    expect(result.value).toEqual(75.5);
    expect(result.unit).toEqual('kg');
    expect(result.id).toBeDefined();
    expect(result.recorded_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save body metric to database', async () => {
    const result = await createBodyMetric(testInput);

    // Query using proper drizzle syntax
    const bodyMetrics = await db.select()
      .from(bodyMetricsTable)
      .where(eq(bodyMetricsTable.id, result.id))
      .execute();

    expect(bodyMetrics).toHaveLength(1);
    expect(bodyMetrics[0].user_id).toEqual('user123');
    expect(bodyMetrics[0].metric_type).toEqual('weight');
    expect(bodyMetrics[0].value).toEqual(75.5);
    expect(bodyMetrics[0].unit).toEqual('kg');
    expect(bodyMetrics[0].recorded_at).toBeInstanceOf(Date);
    expect(bodyMetrics[0].created_at).toBeInstanceOf(Date);
  });

  it('should use provided recorded_at timestamp', async () => {
    const customDate = new Date('2023-12-01T10:00:00Z');
    const inputWithDate: CreateBodyMetricInput = {
      ...testInput,
      recorded_at: customDate
    };

    const result = await createBodyMetric(inputWithDate);

    expect(result.recorded_at).toEqual(customDate);

    // Verify in database
    const bodyMetrics = await db.select()
      .from(bodyMetricsTable)
      .where(eq(bodyMetricsTable.id, result.id))
      .execute();

    expect(bodyMetrics[0].recorded_at).toEqual(customDate);
  });

  it('should use current time when recorded_at is not provided', async () => {
    const beforeCreate = new Date();
    const result = await createBodyMetric(testInput);
    const afterCreate = new Date();

    expect(result.recorded_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.recorded_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('should handle different metric types', async () => {
    const armsMeasurement: CreateBodyMetricInput = {
      user_id: 'user123',
      metric_type: 'arms',
      value: 35.2,
      unit: 'cm'
    };

    const result = await createBodyMetric(armsMeasurement);

    expect(result.metric_type).toEqual('arms');
    expect(result.value).toEqual(35.2);
    expect(result.unit).toEqual('cm');
  });
});
