import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { answers, game_rooms, questions } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

const QUESTION_TIME = 20;
const MAX_POINTS = 1000;
const MIN_POINTS = 100;

function calcPointsServer(
	startedAt: Date | string | null,
	answeredAt: Date | string,
): number {
	if (!startedAt) return 0;
	const elapsed =
		(new Date(answeredAt).getTime() - new Date(startedAt).getTime()) / 1000;
	const ratio = Math.max(0, Math.min(1, elapsed / QUESTION_TIME));
	return Math.max(MIN_POINTS, Math.round(MAX_POINTS * (1 - ratio)));
}

const answerSubmitSchema = z.object({
	id: z.string().uuid(),
	room_id: z.string().uuid(),
	question_id: z.string().uuid(),
	player_id: z.string().uuid(),
	selected_answer: z.string().min(1),
	answered_at: z.union([z.date(), z.string()]),
});

export const Route = createFileRoute("/api/mutations/answers")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const raw = parseDates(await request.json());
				const parsed = answerSubmitSchema.safeParse(raw);
				if (!parsed.success) {
					return Response.json({ error: "Invalid input" }, { status: 400 });
				}
				const body = parsed.data;

				// Look up question and room to compute is_correct and points_earned
				const [question] = await db
					.select()
					.from(questions)
					.where(eq(questions.id, body.question_id))
					.limit(1);
				if (!question) {
					return Response.json(
						{ error: "Question not found" },
						{ status: 404 },
					);
				}

				const [room] = await db
					.select()
					.from(game_rooms)
					.where(eq(game_rooms.id, body.room_id))
					.limit(1);
				if (!room) {
					return Response.json({ error: "Room not found" }, { status: 404 });
				}

				const isCorrect = body.selected_answer === question.correct_answer;
				const pointsEarned = isCorrect
					? calcPointsServer(room.question_started_at, body.answered_at)
					: 0;

				const txid = await db.transaction(async (tx) => {
					await tx.insert(answers).values({
						id: body.id,
						room_id: body.room_id,
						question_id: body.question_id,
						player_id: body.player_id,
						selected_answer: body.selected_answer,
						is_correct: isCorrect,
						points_earned: pointsEarned,
						answered_at: new Date(body.answered_at),
					});
					return generateTxId(tx);
				});
				return Response.json({ txid });
			},
		},
	},
});
