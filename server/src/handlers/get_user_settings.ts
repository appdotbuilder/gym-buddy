
import { db } from '../db';
import { userSettingsTable } from '../db/schema';
import { type GetUserSettingsInput, type UserSettings } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserSettings(input: GetUserSettingsInput): Promise<UserSettings | null> {
  try {
    // Try to find existing settings for the user
    const existingSettings = await db.select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.user_id, input.user_id))
      .execute();

    if (existingSettings.length > 0) {
      const settings = existingSettings[0];
      return {
        ...settings,
        // No numeric conversions needed - all fields are integers or booleans
      };
    }

    // If no settings exist, create default settings
    const result = await db.insert(userSettingsTable)
      .values({
        user_id: input.user_id,
        timer_duration: 120, // Default 2 minutes
        dark_mode: true,
        body_metric_reminder_enabled: true
      })
      .returning()
      .execute();

    const newSettings = result[0];
    return {
      ...newSettings,
      // No numeric conversions needed - all fields are integers or booleans
    };
  } catch (error) {
    console.error('Failed to get user settings:', error);
    throw error;
  }
}
