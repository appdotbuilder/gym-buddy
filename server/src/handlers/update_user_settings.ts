
import { db } from '../db';
import { userSettingsTable } from '../db/schema';
import { type UpdateUserSettingsInput, type UserSettings } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserSettings = async (input: UpdateUserSettingsInput): Promise<UserSettings> => {
  try {
    // Check if user settings already exist
    const existingSettings = await db.select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.user_id, input.user_id))
      .execute();

    if (existingSettings.length > 0) {
      // Update existing settings
      const updateData: any = {
        updated_at: new Date()
      };

      // Only update fields that are provided
      if (input.timer_duration !== undefined) {
        updateData.timer_duration = input.timer_duration;
      }
      if (input.dark_mode !== undefined) {
        updateData.dark_mode = input.dark_mode;
      }
      if (input.body_metric_reminder_enabled !== undefined) {
        updateData.body_metric_reminder_enabled = input.body_metric_reminder_enabled;
      }

      const result = await db.update(userSettingsTable)
        .set(updateData)
        .where(eq(userSettingsTable.user_id, input.user_id))
        .returning()
        .execute();

      return result[0];
    } else {
      // Create new settings with defaults for unspecified fields
      const result = await db.insert(userSettingsTable)
        .values({
          user_id: input.user_id,
          timer_duration: input.timer_duration ?? 120,
          dark_mode: input.dark_mode ?? true,
          body_metric_reminder_enabled: input.body_metric_reminder_enabled ?? true
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('User settings update failed:', error);
    throw error;
  }
};
