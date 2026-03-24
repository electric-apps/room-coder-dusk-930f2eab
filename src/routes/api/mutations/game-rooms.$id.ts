import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { game_rooms, players } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

const patchSchema = z.object({
	status: z.string().optional(),
	current_question_id: z.string().uuid().nullable().optional(),
	question_started_at: z.union([z.date(), z.string(), z.null()]).optional(),
	round_number: z.number().int().optional(),
	question_queue: z.string().nullable().optional(),
	_requester_player_id: z.string().uuid(),
});

export const Route = createFileRoute("/api/mutations/game-rooms/$id")({
	server: {
		handlers: {
			PATCH: async ({ request, params }) => {
				const raw = parseDates(await request.json());
				const parsed = patchSchema.safeParse(raw);
				if (!parsed.success) {
					return Response.json({ error: "Invalid input" }, { status: 400 });
				}
				const { _requester_player_id, ...fields } = parsed.data;

				// Verify requester is the host of this room
				const [room] = await db
					.select()
					.from(game_rooms)
					.where(eq(game_rooms.id, params.id))
					.limit(1);
				if (!room) {
					return Response.json({ error: "Room not found" }, { status: 404 });
				}

				const [requester] = await db
					.select()
					.from(players)
					.where(eq(players.id, _requester_player_id))
					.limit(1);
				if (
					!requester ||
					requester.room_id !== params.id ||
					requester.name !== room.host_name
				) {
					return Response.json({ error: "Forbidden" }, { status: 403 });
				}

				const txid = await db.transaction(async (tx) => {
					await tx
						.update(game_rooms)
						.set({
							status: fields.status,
							current_question_id: fields.current_question_id,
							question_started_at:
								fields.question_started_at !== undefined
									? fields.question_started_at === null
										? null
										: new Date(fields.question_started_at)
									: undefined,
							round_number: fields.round_number,
							question_queue: fields.question_queue,
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
