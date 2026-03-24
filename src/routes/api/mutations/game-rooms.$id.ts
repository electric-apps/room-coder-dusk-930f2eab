import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { game_rooms } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

export const Route = createFileRoute("/api/mutations/game-rooms/$id")({
	server: {
		handlers: {
			PATCH: async ({ request, params }) => {
				const body = parseDates(await request.json());
				const txid = await db.transaction(async (tx) => {
					await tx
						.update(game_rooms)
						.set({
							status: body.status,
							current_question_id: body.current_question_id,
							question_started_at: body.question_started_at,
							round_number: body.round_number,
							updated_at: new Date(),
						})
						.where(eq(game_rooms.id, params.id));
					return generateTxId(tx);
				});
				return Response.json({ txid });
			},
		},
	},
});
