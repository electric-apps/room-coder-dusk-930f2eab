import { createCollection } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { playerSelectSchema } from "@/db/zod-schemas";

export const playersCollection = createCollection(
	electricCollectionOptions({
		id: "players",
		schema: playerSelectSchema,
		shapeOptions: {
			url: "/api/shape/players",
		},
		getKey: (row) => row.id,
		onInsert: async ({ transaction }) => {
			const player = transaction.mutations[0].modified;
			const res = await fetch("/api/mutations/players", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(player),
			});
			const data = await res.json();
			return { txid: data.txid };
		},
		onUpdate: async ({ transaction }) => {
			const { modified } = transaction.mutations[0];
			const res = await fetch(`/api/mutations/players/${modified.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(modified),
			});
			const data = await res.json();
			return { txid: data.txid };
		},
	}),
);
