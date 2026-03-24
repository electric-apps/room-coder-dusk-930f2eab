import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@/db";
import { players } from "@/db/schema";
import { generateTxId, parseDates } from "@/db/utils";

const patchSchema = z.object({
	score: z.number().int().optional(),
	is_ready: z.boolean().optional(),
});

export const Route = createFileRoute("/api/mutations/players/$id")({
	server: {
		handlers: {
			PATCH: async ({ request, params }) => {
				const raw = parseDates(await request.json());
				const parsed = patchSchema.safeParse(raw);
				if (!parsed.success) {
					return Response.json({ error: "Invalid input" }, { status: 400 });
				}
				const body = parsed.data;
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
