
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { trainingSessionsTable, exercisesTable, seriesTable } from '../db/schema';
import { getExerciseWithSeries } from '../handlers/get_exercise_with_series';

describe('getExerciseWithSeries', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return exercise with series data', async () => {
        // Create training session
        const trainingSession = await db.insert(trainingSessionsTable)
            .values({
                name: 'Push Day',
                type: 'push',
                description: 'Upper body push workout'
            })
            .returning()
            .execute();

        // Create exercise
        const exercise = await db.insert(exercisesTable)
            .values({
                training_session_id: trainingSession[0].id,
                name: 'Bench Press',
                description: 'Chest exercise',
                target_series: 3
            })
            .returning()
            .execute();

        // Create series data - insert each one individually to avoid type issues
        await db.insert(seriesTable)
            .values({
                exercise_id: exercise[0].id,
                series_number: 1,
                target_repetitions: 12,
                target_weight: 80.5
            })
            .execute();

        await db.insert(seriesTable)
            .values({
                exercise_id: exercise[0].id,
                series_number: 2,
                target_repetitions: 10,
                target_weight: 85.0
            })
            .execute();

        await db.insert(seriesTable)
            .values({
                exercise_id: exercise[0].id,
                series_number: 3,
                target_repetitions: 8,
                target_weight: 90.5
            })
            .execute();

        // Test the handler
        const result = await getExerciseWithSeries(exercise[0].id);

        // Verify exercise data
        expect(result).not.toBeNull();
        expect(result!.id).toEqual(exercise[0].id);
        expect(result!.name).toEqual('Bench Press');
        expect(result!.description).toEqual('Chest exercise');
        expect(result!.target_series).toEqual(3);
        expect(result!.training_session_id).toEqual(trainingSession[0].id);
        expect(result!.created_at).toBeInstanceOf(Date);

        // Verify series data
        expect(result!.series).toHaveLength(3);
        
        const series1 = result!.series.find(s => s.series_number === 1);
        expect(series1).toBeDefined();
        expect(series1!.target_repetitions).toEqual(12);
        expect(series1!.target_weight).toEqual(80.5);
        expect(typeof series1!.target_weight).toEqual('number');

        const series2 = result!.series.find(s => s.series_number === 2);
        expect(series2).toBeDefined();
        expect(series2!.target_repetitions).toEqual(10);
        expect(series2!.target_weight).toEqual(85.0);

        const series3 = result!.series.find(s => s.series_number === 3);
        expect(series3).toBeDefined();
        expect(series3!.target_repetitions).toEqual(8);
        expect(series3!.target_weight).toEqual(90.5);
    });

    it('should return null for non-existent exercise', async () => {
        const result = await getExerciseWithSeries(999);
        expect(result).toBeNull();
    });

    it('should return exercise with empty series array if no series exist', async () => {
        // Create training session
        const trainingSession = await db.insert(trainingSessionsTable)
            .values({
                name: 'Push Day',
                type: 'push',
                description: 'Upper body push workout'
            })
            .returning()
            .execute();

        // Create exercise without series
        const exercise = await db.insert(exercisesTable)
            .values({
                training_session_id: trainingSession[0].id,
                name: 'Push Ups',
                description: 'Bodyweight exercise',
                target_series: 2
            })
            .returning()
            .execute();

        const result = await getExerciseWithSeries(exercise[0].id);

        expect(result).not.toBeNull();
        expect(result!.name).toEqual('Push Ups');
        expect(result!.series).toHaveLength(0);
    });
});
