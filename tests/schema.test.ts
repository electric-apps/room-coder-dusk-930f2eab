import { describe, it, expect } from "vitest"
import {
	categorySelectSchema,
	categoryInsertSchema,
	questionSelectSchema,
	questionInsertSchema,
	gameRoomSelectSchema,
	gameRoomInsertSchema,
	playerSelectSchema,
	playerInsertSchema,
	answerSelectSchema,
	answerInsertSchema,
} from "@/db/zod-schemas"
import {
	generateValidRow,
	generateRowWithout,
} from "./helpers/schema-test-utils"

describe("Category schema", () => {
	it("accepts a valid row", () => {
		const row = generateValidRow(categorySelectSchema)
		expect(categorySelectSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without name", () => {
		const row = generateRowWithout(categorySelectSchema, "name")
		expect(categorySelectSchema.safeParse(row).success).toBe(false)
	})
	it("rejects row without emoji", () => {
		const row = generateRowWithout(categorySelectSchema, "emoji")
		expect(categorySelectSchema.safeParse(row).success).toBe(false)
	})
})

describe("Question schema", () => {
	it("accepts a valid row", () => {
		const row = generateValidRow(questionSelectSchema)
		expect(questionSelectSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without question_text", () => {
		const row = generateRowWithout(questionSelectSchema, "question_text")
		expect(questionSelectSchema.safeParse(row).success).toBe(false)
	})
	it("rejects row without correct_answer", () => {
		const row = generateRowWithout(questionSelectSchema, "correct_answer")
		expect(questionSelectSchema.safeParse(row).success).toBe(false)
	})
	it("insert schema has defaults for difficulty", () => {
		const row = generateValidRow(questionInsertSchema)
		expect(questionInsertSchema.safeParse(row).success).toBe(true)
	})
})

describe("GameRoom schema", () => {
	it("accepts a valid row", () => {
		const row = generateValidRow(gameRoomSelectSchema)
		expect(gameRoomSelectSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without code", () => {
		const row = generateRowWithout(gameRoomSelectSchema, "code")
		expect(gameRoomSelectSchema.safeParse(row).success).toBe(false)
	})
	it("rejects row without host_name", () => {
		const row = generateRowWithout(gameRoomSelectSchema, "host_name")
		expect(gameRoomSelectSchema.safeParse(row).success).toBe(false)
	})
	it("accepts null for current_question_id", () => {
		const row = { ...generateValidRow(gameRoomSelectSchema), current_question_id: null }
		expect(gameRoomSelectSchema.safeParse(row).success).toBe(true)
	})
	it("accepts null for question_started_at", () => {
		const row = { ...generateValidRow(gameRoomSelectSchema), question_started_at: null }
		expect(gameRoomSelectSchema.safeParse(row).success).toBe(true)
	})
})

describe("Player schema", () => {
	it("accepts a valid row", () => {
		const row = generateValidRow(playerSelectSchema)
		expect(playerSelectSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without name", () => {
		const row = generateRowWithout(playerSelectSchema, "name")
		expect(playerSelectSchema.safeParse(row).success).toBe(false)
	})
	it("rejects row without room_id", () => {
		const row = generateRowWithout(playerSelectSchema, "room_id")
		expect(playerSelectSchema.safeParse(row).success).toBe(false)
	})
})

describe("Answer schema", () => {
	it("accepts a valid row", () => {
		const row = generateValidRow(answerSelectSchema)
		expect(answerSelectSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without selected_answer", () => {
		const row = generateRowWithout(answerSelectSchema, "selected_answer")
		expect(answerSelectSchema.safeParse(row).success).toBe(false)
	})
	it("rejects row without player_id", () => {
		const row = generateRowWithout(answerSelectSchema, "player_id")
		expect(answerSelectSchema.safeParse(row).success).toBe(false)
	})
})
