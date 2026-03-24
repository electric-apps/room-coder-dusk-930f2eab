import { createCollection } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { questionSelectSchema } from "@/db/zod-schemas";

export const questionsCollection = createCollection(
	electricCollectionOptions({
		id: "questions",
		schema: questionSelectSchema,
		shapeOptions: {
			url: "/api/shape/questions",
		},
		getKey: (row) => row.id,
	}),
);
