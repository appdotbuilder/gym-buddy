
import { db } from '../db';
import { bodyMetricsTable } from '../db/schema';
import { type CreateBodyMetricInput, type BodyMetric } from '../schema';

export const createBodyMetric = async (input: CreateBodyMetricInput): Promise<BodyMetric> => {
  try {
    // Insert body metric record
    const result = await db.insert(bodyMetricsTable)
      .values({
        user_id: input.user_id,
        metric_type: input.metric_type,
        value: input.value,
        unit: input.unit,
        recorded_at: input.recorded_at || new Date()
      })
      .returning()
      .execute();

    // Return the created body metric
    const bodyMetric = result[0];
    return bodyMetric;
  } catch (error) {
    console.error('Body metric creation failed:', error);
    throw error;
  }
};
