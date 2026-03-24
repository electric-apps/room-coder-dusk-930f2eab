import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

export const Route = createFileRoute("/api/mutations/players/$id")({
	server: {
		handlers: {
			PATCH: async ({ request, params }) => {
				const body = parseDates(await request.json());
				const txid = await db.transaction(async (tx) => {
					await tx
						.update(players)
						.set({
							score: body.score,
							is_ready: body.is_ready,
							updated_at: new Date(),
						})
						.where(eq(players.id, params.id));
					return generateTxId(tx);
				});
				return Response.json({ txid });
			},
		},
	},
});
