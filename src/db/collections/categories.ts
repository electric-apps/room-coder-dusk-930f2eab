import { createCollection } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import { categorySelectSchema } from "@/db/zod-schemas";

export const categoriesCollection = createCollection(
	electricCollectionOptions({
		id: "categories",
		schema: categorySelectSchema,
		shapeOptions: {
			url: "/api/shape/categories",
		},
		getKey: (row) => row.id,
	}),
);
