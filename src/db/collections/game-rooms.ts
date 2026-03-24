import { createCollection } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { gameRoomSelectSchema } from "@/db/zod-schemas";

function getRequesterPlayerId(roomCode: string): string | null {
	try {
		const raw = sessionStorage.getItem(`trivia_player_${roomCode}`);
		if (!raw) return null;
		return JSON.parse(raw).playerId ?? null;
	} catch {
		return null;
	}
}

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
			const requesterId = getRequesterPlayerId(modified.code);
			const res = await fetch(`/api/mutations/game-rooms/${modified.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...modified,
					_requester_player_id: requesterId,
				}),
			});
			const data = await res.json();
			return { txid: data.txid };
		},
	}),
);
