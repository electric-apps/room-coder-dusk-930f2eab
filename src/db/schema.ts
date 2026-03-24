import {
	boolean,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
	id: uuid().primaryKey().defaultRandom(),
	name: text().notNull(),
	emoji: text().notNull(),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
	id: uuid().primaryKey().defaultRandom(),
	category_id: uuid()
		.notNull()
		.references(() => categories.id, { onDelete: "cascade" }),
	question_text: text().notNull(),
	correct_answer: text().notNull(),
	wrong_answer_1: text().notNull(),
	wrong_answer_2: text().notNull(),
	wrong_answer_3: text().notNull(),
	difficulty: text().notNull().default("medium"),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const game_rooms = pgTable("game_rooms", {
	id: uuid().primaryKey().defaultRandom(),
	code: text().notNull().unique(),
	host_name: text().notNull(),
	status: text().notNull().default("waiting"),
	current_question_id: uuid().references(() => questions.id),
	question_started_at: timestamp({ withTimezone: true }),
	round_number: integer().notNull().default(0),
	total_rounds: integer().notNull().default(5),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const players = pgTable("players", {
	id: uuid().primaryKey().defaultRandom(),
	room_id: uuid()
		.notNull()
		.references(() => game_rooms.id, { onDelete: "cascade" }),
	name: text().notNull(),
	score: integer().notNull().default(0),
	is_ready: boolean().notNull().default(false),
	created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const answers = pgTable("answers", {
	id: uuid().primaryKey().defaultRandom(),
	room_id: uuid()
		.notNull()
		.references(() => game_rooms.id, { onDelete: "cascade" }),
	question_id: uuid()
		.notNull()
		.references(() => questions.id, { onDelete: "cascade" }),
	player_id: uuid()
		.notNull()
		.references(() => players.id, { onDelete: "cascade" }),
	selected_answer: text().notNull(),
	is_correct: boolean().notNull(),
	points_earned: integer().notNull().default(0),
	answered_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
