
import { db } from '../db';
import { bodyMetricsTable } from '../db/schema';
import { type GetBodyMetricsInput, type BodyMetric } from '../schema';
import { eq, desc, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getBodyMetrics(input: GetBodyMetricsInput): Promise<BodyMetric[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by user_id
    conditions.push(eq(bodyMetricsTable.user_id, input.user_id));
    
    // Filter by metric_type if provided
    if (input.metric_type) {
      conditions.push(eq(bodyMetricsTable.metric_type, input.metric_type));
    }

    // Build the complete query in one chain
    const results = await db.select()
      .from(bodyMetricsTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(bodyMetricsTable.recorded_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result,
      value: parseFloat(result.value.toString()) // Convert real to number
    }));
  } catch (error) {
    console.error('Failed to get body metrics:', error);
    throw error;
  }
}
