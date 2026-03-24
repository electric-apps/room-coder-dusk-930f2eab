import { z } from "zod/v4"
import { createSelectSchema, createInsertSchema } from "drizzle-zod"
import { categories, questions, game_rooms, players, answers } from "./schema"

const timestampOverride = z.union([z.date(), z.string()])
const nullableTimestampOverride = z.union([z.date(), z.string(), z.null()])

// Categories
export const categorySelectSchema = createSelectSchema(categories, {
	created_at: timestampOverride,
})
export const categoryInsertSchema = createInsertSchema(categories, {
	created_at: timestampOverride,
})
export type Category = typeof categorySelectSchema._type
export type NewCategory = typeof categoryInsertSchema._type

// Questions
export const questionSelectSchema = createSelectSchema(questions, {
	created_at: timestampOverride,
})
export const questionInsertSchema = createInsertSchema(questions, {
	created_at: timestampOverride,
})
export type Question = typeof questionSelectSchema._type
export type NewQuestion = typeof questionInsertSchema._type

// Game Rooms
export const gameRoomSelectSchema = createSelectSchema(game_rooms, {
	created_at: timestampOverride,
	updated_at: timestampOverride,
	question_started_at: nullableTimestampOverride,
})
export const gameRoomInsertSchema = createInsertSchema(game_rooms, {
	created_at: timestampOverride,
	updated_at: timestampOverride,
	question_started_at: nullableTimestampOverride,
})
export type GameRoom = typeof gameRoomSelectSchema._type
export type NewGameRoom = typeof gameRoomInsertSchema._type

// Players
export const playerSelectSchema = createSelectSchema(players, {
	created_at: timestampOverride,
	updated_at: timestampOverride,
})
export const playerInsertSchema = createInsertSchema(players, {
	created_at: timestampOverride,
	updated_at: timestampOverride,
})
export type Player = typeof playerSelectSchema._type
export type NewPlayer = typeof playerInsertSchema._type

// Answers
export const answerSelectSchema = createSelectSchema(answers, {
	answered_at: timestampOverride,
})
export const answerInsertSchema = createInsertSchema(answers, {
	answered_at: timestampOverride,
})
export type Answer = typeof answerSelectSchema._type
export type NewAnswer = typeof answerInsertSchema._type
