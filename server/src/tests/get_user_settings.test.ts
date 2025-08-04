
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSettingsTable } from '../db/schema';
import { type GetUserSettingsInput } from '../schema';
import { getUserSettings } from '../handlers/get_user_settings';
import { eq } from 'drizzle-orm';

const testInput: GetUserSettingsInput = {
  user_id: 'test-user-123'
};

describe('getUserSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return existing user settings', async () => {
    // Create existing settings first
    await db.insert(userSettingsTable)
      .values({
        user_id: testInput.user_id,
        timer_duration: 180,
        dark_mode: false,
        body_metric_reminder_enabled: false
      })
      .execute();

    const result = await getUserSettings(testInput);

    expect(result).toBeDefined();
    expect(result!.user_id).toEqual('test-user-123');
    expect(result!.timer_duration).toEqual(180);
    expect(result!.dark_mode).toEqual(false);
    expect(result!.body_metric_reminder_enabled).toEqual(false);
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should create default settings when none exist', async () => {
    const result = await getUserSettings(testInput);

    expect(result).toBeDefined();
    expect(result!.user_id).toEqual('test-user-123');
    expect(result!.timer_duration).toEqual(120); // Default 2 minutes
    expect(result!.dark_mode).toEqual(true); // Default dark mode
    expect(result!.body_metric_reminder_enabled).toEqual(true); // Default reminders enabled
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should save default settings to database', async () => {
    const result = await getUserSettings(testInput);

    // Verify settings were saved to database
    const savedSettings = await db.select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.user_id, testInput.user_id))
      .execute();

    expect(savedSettings).toHaveLength(1);
    expect(savedSettings[0].user_id).toEqual('test-user-123');
    expect(savedSettings[0].timer_duration).toEqual(120);
    expect(savedSettings[0].dark_mode).toEqual(true);
    expect(savedSettings[0].body_metric_reminder_enabled).toEqual(true);
    expect(savedSettings[0].id).toEqual(result!.id);
  });

  it('should handle different user IDs correctly', async () => {
    const user1Input: GetUserSettingsInput = { user_id: 'user-1' };
    const user2Input: GetUserSettingsInput = { user_id: 'user-2' };

    // Create settings for both users
    const result1 = await getUserSettings(user1Input);
    const result2 = await getUserSettings(user2Input);

    expect(result1!.user_id).toEqual('user-1');
    expect(result2!.user_id).toEqual('user-2');
    expect(result1!.id).not.toEqual(result2!.id);

    // Verify both settings exist in database
    const allSettings = await db.select()
      .from(userSettingsTable)
      .execute();

    expect(allSettings).toHaveLength(2);
    const userIds = allSettings.map(s => s.user_id).sort();
    expect(userIds).toEqual(['user-1', 'user-2']);
  });
});
