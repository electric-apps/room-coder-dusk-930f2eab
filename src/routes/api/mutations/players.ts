import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { players } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

export const Route = createFileRoute("/api/mutations/players")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const body = parseDates(await request.json());
				const txid = await db.transaction(async (tx) => {
					await tx.insert(players).values(body);
					return generateTxId(tx);
				});
				return Response.json({ txid });
			},
		},
	},
});
