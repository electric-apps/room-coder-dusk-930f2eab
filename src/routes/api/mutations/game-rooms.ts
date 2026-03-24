import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { game_rooms } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

export const Route = createFileRoute("/api/mutations/game-rooms")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const body = parseDates(await request.json());
				const txid = await db.transaction(async (tx) => {
					await tx.insert(game_rooms).values(body);
					return generateTxId(tx);
				});
				return Response.json({ txid });
			},
		},
	},
});
