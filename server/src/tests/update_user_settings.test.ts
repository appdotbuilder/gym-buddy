
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userSettingsTable } from '../db/schema';
import { type UpdateUserSettingsInput } from '../schema';
import { updateUserSettings } from '../handlers/update_user_settings';
import { eq } from 'drizzle-orm';

// Test input for creating new settings
const testInput: UpdateUserSettingsInput = {
  user_id: 'test-user-123',
  timer_duration: 180,
  dark_mode: false,
  body_metric_reminder_enabled: false
};

describe('updateUserSettings', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new user settings when none exist', async () => {
    const result = await updateUserSettings(testInput);

    // Verify returned data
    expect(result.user_id).toEqual('test-user-123');
    expect(result.timer_duration).toEqual(180);
    expect(result.dark_mode).toEqual(false);
    expect(result.body_metric_reminder_enabled).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save new settings to database', async () => {
    const result = await updateUserSettings(testInput);

    // Verify database record
    const settings = await db.select()
      .from(userSettingsTable)
      .where(eq(userSettingsTable.user_id, 'test-user-123'))
      .execute();

    expect(settings).toHaveLength(1);
    expect(settings[0].user_id).toEqual('test-user-123');
    expect(settings[0].timer_duration).toEqual(180);
    expect(settings[0].dark_mode).toEqual(false);
    expect(settings[0].body_metric_reminder_enabled).toEqual(false);
  });

  it('should update existing user settings', async () => {
    // Create initial settings
    await db.insert(userSettingsTable)
      .values({
        user_id: 'test-user-123',
        timer_duration: 120,
        dark_mode: true,
        body_metric_reminder_enabled: true
      })
      .execute();

    // Update with new values
    const updateInput: UpdateUserSettingsInput = {
      user_id: 'test-user-123',
      timer_duration: 300,
      dark_mode: false
    };

    const result = await updateUserSettings(updateInput);

    // Verify updated values
    expect(result.timer_duration).toEqual(300);
    expect(result.dark_mode).toEqual(false);
    expect(result.body_metric_reminder_enabled).toEqual(true); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should apply defaults for missing fields when creating new settings', async () => {
    const partialInput: UpdateUserSettingsInput = {
      user_id: 'test-user-456',
      timer_duration: 240
    };

    const result = await updateUserSettings(partialInput);

    // Verify defaults are applied
    expect(result.timer_duration).toEqual(240);
    expect(result.dark_mode).toEqual(true); // Default
    expect(result.body_metric_reminder_enabled).toEqual(true); // Default
  });

  it('should only update specified fields for existing settings', async () => {
    // Create initial settings
    await db.insert(userSettingsTable)
      .values({
        user_id: 'test-user-789',
        timer_duration: 90,
        dark_mode: false,
        body_metric_reminder_enabled: false
      })
      .execute();

    // Update only one field
    const updateInput: UpdateUserSettingsInput = {
      user_id: 'test-user-789',
      body_metric_reminder_enabled: true
    };

    const result = await updateUserSettings(updateInput);

    // Verify only specified field changed
    expect(result.timer_duration).toEqual(90); // Unchanged
    expect(result.dark_mode).toEqual(false); // Unchanged
    expect(result.body_metric_reminder_enabled).toEqual(true); // Updated
  });

  it('should update timestamp when modifying existing settings', async () => {
    // Create initial settings
    const initialResult = await db.insert(userSettingsTable)
      .values({
        user_id: 'test-user-time',
        timer_duration: 120,
        dark_mode: true,
        body_metric_reminder_enabled: true
      })
      .returning()
      .execute();

    const originalUpdatedAt = initialResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update settings
    const updateInput: UpdateUserSettingsInput = {
      user_id: 'test-user-time',
      timer_duration: 150
    };

    const result = await updateUserSettings(updateInput);

    // Verify updated_at timestamp changed
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});
