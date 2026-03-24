import { describe, it, expect } from "vitest"
import {
	gameRoomInsertSchema,
	playerInsertSchema,
	answerInsertSchema,
	gameRoomSelectSchema,
	playerSelectSchema,
	answerSelectSchema,
} from "@/db/zod-schemas"
import {
	generateValidRow,
	generateRowWithout,
	parseDates,
} from "./helpers/schema-test-utils"

describe("GameRoom insert validation", () => {
	it("accepts a valid insert row", () => {
		const row = generateValidRow(gameRoomInsertSchema)
		expect(gameRoomInsertSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without code", () => {
		const row = generateRowWithout(gameRoomInsertSchema, "code")
		expect(gameRoomInsertSchema.safeParse(row).success).toBe(false)
	})
	it("accepts null for current_question_id", () => {
		const row = { ...generateValidRow(gameRoomInsertSchema), current_question_id: null }
		expect(gameRoomInsertSchema.safeParse(row).success).toBe(true)
	})
})

describe("Player insert validation", () => {
	it("accepts a valid insert row", () => {
		const row = generateValidRow(playerInsertSchema)
		expect(playerInsertSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without room_id", () => {
		const row = generateRowWithout(playerInsertSchema, "room_id")
		expect(playerInsertSchema.safeParse(row).success).toBe(false)
	})
	it("rejects row without name", () => {
		const row = generateRowWithout(playerInsertSchema, "name")
		expect(playerInsertSchema.safeParse(row).success).toBe(false)
	})
})

describe("Answer insert validation", () => {
	it("accepts a valid insert row", () => {
		const row = generateValidRow(answerInsertSchema)
		expect(answerInsertSchema.safeParse(row).success).toBe(true)
	})
	it("rejects row without selected_answer", () => {
		const row = generateRowWithout(answerInsertSchema, "selected_answer")
		expect(answerInsertSchema.safeParse(row).success).toBe(false)
	})
})

describe("JSON round-trip", () => {
	it("parseDates converts ISO strings back to dates in game_room", () => {
		const row = generateValidRow(gameRoomSelectSchema)
		const roundTripped = parseDates(JSON.parse(JSON.stringify(row)))
		expect(gameRoomSelectSchema.safeParse(roundTripped).success).toBe(true)
	})

	it("parseDates converts ISO strings back to dates in player", () => {
		const row = generateValidRow(playerSelectSchema)
		const roundTripped = parseDates(JSON.parse(JSON.stringify(row)))
		expect(playerSelectSchema.safeParse(roundTripped).success).toBe(true)
	})

	it("parseDates converts ISO strings back to dates in answer", () => {
		const row = generateValidRow(answerSelectSchema)
		const roundTripped = parseDates(JSON.parse(JSON.stringify(row)))
		expect(answerSelectSchema.safeParse(roundTripped).success).toBe(true)
	})
})
