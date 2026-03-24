import { createCollection } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { gameRoomSelectSchema } from "@/db/zod-schemas";

export const gameRoomsCollection = createCollection(
	electricCollectionOptions({
		id: "game-rooms",
		schema: gameRoomSelectSchema,
		shapeOptions: {
			url: "/api/shape/game-rooms",
		},
		getKey: (row) => row.id,
		onInsert: async ({ transaction }) => {
			const room = transaction.mutations[0].modified;
			const res = await fetch("/api/mutations/game-rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(room),
			});
			const data = await res.json();
			return { txid: data.txid };
		},
		onUpdate: async ({ transaction }) => {
			const { modified } = transaction.mutations[0];
			const res = await fetch(`/api/mutations/game-rooms/${modified.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(modified),
			});
			const data = await res.json();
			return { txid: data.txid };
		},
	}),
);
