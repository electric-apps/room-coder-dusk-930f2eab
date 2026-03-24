import { createFileRoute } from "@tanstack/react-router";
import { db } from "@/db";
import { players } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";
import { playerInsertSchema } from "@/db/zod-schemas";

export const Route = createFileRoute("/api/mutations/players")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const raw = parseDates(await request.json());
				const parsed = playerInsertSchema.safeParse(raw);
				if (!parsed.success) {
					return Response.json({ error: "Invalid input" }, { status: 400 });
				}
				const body = parsed.data;
				const txid = await db.transaction(async (tx) => {
					await tx.insert(players).values(body);
					return generateTxId(tx);
				});
				return Response.json({ txid });
			},
		},
	},
});
