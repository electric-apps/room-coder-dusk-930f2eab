import { createCollection } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { answerSelectSchema } from "@/db/zod-schemas";

export const answersCollection = createCollection(
	electricCollectionOptions({
		id: "answers",
		schema: answerSelectSchema,
		shapeOptions: {
			url: "/api/shape/answers",
		},
		getKey: (row) => row.id,
		onInsert: async ({ transaction }) => {
			const answer = transaction.mutations[0].modified;
			const res = await fetch("/api/mutations/answers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(answer),
			});
			const data = await res.json();
			return { txid: data.txid };
		},
	}),
);
