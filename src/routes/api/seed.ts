import { createFileRoute } from "@tanstack/react-router";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { categories, questions } from "@/db/schema";

const SEED_CATEGORIES = [
	{ name: "Science", emoji: "🔬" },
	{ name: "History", emoji: "📜" },
	{ name: "Geography", emoji: "🌍" },
	{ name: "Pop Culture", emoji: "🎬" },
	{ name: "Sports", emoji: "⚽" },
];

const SEED_QUESTIONS = [
	// Science
	{
		question_text: "What is the chemical symbol for Gold?",
		correct_answer: "Au",
		wrong_answer_1: "Go",
		wrong_answer_2: "Gd",
		wrong_answer_3: "Ag",
		difficulty: "easy",
		category_index: 0,
	},
	{
		question_text: "How many bones are in the adult human body?",
		correct_answer: "206",
		wrong_answer_1: "198",
		wrong_answer_2: "214",
		wrong_answer_3: "220",
		difficulty: "medium",
		category_index: 0,
	},
	{
		question_text: "What is the speed of light (approximate) in km/s?",
		correct_answer: "300,000 km/s",
		wrong_answer_1: "150,000 km/s",
		wrong_answer_2: "500,000 km/s",
		wrong_answer_3: "200,000 km/s",
		difficulty: "medium",
		category_index: 0,
	},
	{
		question_text: "What planet is known as the Red Planet?",
		correct_answer: "Mars",
		wrong_answer_1: "Jupiter",
		wrong_answer_2: "Venus",
		wrong_answer_3: "Saturn",
		difficulty: "easy",
		category_index: 0,
	},
	{
		question_text: "What is the powerhouse of the cell?",
		correct_answer: "Mitochondria",
		wrong_answer_1: "Nucleus",
		wrong_answer_2: "Ribosome",
		wrong_answer_3: "Golgi Apparatus",
		difficulty: "easy",
		category_index: 0,
	},
	// History
	{
		question_text: "In what year did World War II end?",
		correct_answer: "1945",
		wrong_answer_1: "1942",
		wrong_answer_2: "1947",
		wrong_answer_3: "1939",
		difficulty: "easy",
		category_index: 1,
	},
	{
		question_text: "Who was the first President of the United States?",
		correct_answer: "George Washington",
		wrong_answer_1: "Thomas Jefferson",
		wrong_answer_2: "John Adams",
		wrong_answer_3: "Benjamin Franklin",
		difficulty: "easy",
		category_index: 1,
	},
	{
		question_text:
			"The ancient city of Rome was famously built on how many hills?",
		correct_answer: "7",
		wrong_answer_1: "3",
		wrong_answer_2: "5",
		wrong_answer_3: "12",
		difficulty: "medium",
		category_index: 1,
	},
	{
		question_text: "What empire was ruled by Julius Caesar?",
		correct_answer: "Roman Empire",
		wrong_answer_1: "Greek Empire",
		wrong_answer_2: "Byzantine Empire",
		wrong_answer_3: "Ottoman Empire",
		difficulty: "easy",
		category_index: 1,
	},
	{
		question_text: "The Berlin Wall fell in what year?",
		correct_answer: "1989",
		wrong_answer_1: "1991",
		wrong_answer_2: "1985",
		wrong_answer_3: "1979",
		difficulty: "medium",
		category_index: 1,
	},
	// Geography
	{
		question_text: "What is the capital of Australia?",
		correct_answer: "Canberra",
		wrong_answer_1: "Sydney",
		wrong_answer_2: "Melbourne",
		wrong_answer_3: "Perth",
		difficulty: "medium",
		category_index: 2,
	},
	{
		question_text: "Which is the longest river in the world?",
		correct_answer: "Nile",
		wrong_answer_1: "Amazon",
		wrong_answer_2: "Yangtze",
		wrong_answer_3: "Mississippi",
		difficulty: "medium",
		category_index: 2,
	},
	{
		question_text: "What is the smallest country in the world?",
		correct_answer: "Vatican City",
		wrong_answer_1: "Monaco",
		wrong_answer_2: "San Marino",
		wrong_answer_3: "Liechtenstein",
		difficulty: "medium",
		category_index: 2,
	},
	{
		question_text: "On which continent is the Sahara Desert located?",
		correct_answer: "Africa",
		wrong_answer_1: "Asia",
		wrong_answer_2: "South America",
		wrong_answer_3: "Australia",
		difficulty: "easy",
		category_index: 2,
	},
	{
		question_text: "What is the tallest mountain in the world?",
		correct_answer: "Mount Everest",
		wrong_answer_1: "K2",
		wrong_answer_2: "Kilimanjaro",
		wrong_answer_3: "Mont Blanc",
		difficulty: "easy",
		category_index: 2,
	},
	// Pop Culture
	{
		question_text: "Which movie franchise features the character Jack Sparrow?",
		correct_answer: "Pirates of the Caribbean",
		wrong_answer_1: "Treasure Island",
		wrong_answer_2: "The Mummy",
		wrong_answer_3: "Indiana Jones",
		difficulty: "easy",
		category_index: 3,
	},
	{
		question_text:
			"What is the name of the fictional land in The Lion, the Witch and the Wardrobe?",
		correct_answer: "Narnia",
		wrong_answer_1: "Neverland",
		wrong_answer_2: "Oz",
		wrong_answer_3: "Wonderland",
		difficulty: "easy",
		category_index: 3,
	},
	{
		question_text: "Which band performed 'Bohemian Rhapsody'?",
		correct_answer: "Queen",
		wrong_answer_1: "The Beatles",
		wrong_answer_2: "Led Zeppelin",
		wrong_answer_3: "The Rolling Stones",
		difficulty: "easy",
		category_index: 3,
	},
	{
		question_text:
			"In which TV show would you find the character Walter White?",
		correct_answer: "Breaking Bad",
		wrong_answer_1: "Better Call Saul",
		wrong_answer_2: "The Wire",
		wrong_answer_3: "Ozark",
		difficulty: "easy",
		category_index: 3,
	},
	{
		question_text:
			"What is the highest-grossing film of all time (unadjusted)?",
		correct_answer: "Avatar",
		wrong_answer_1: "Avengers: Endgame",
		wrong_answer_2: "Titanic",
		wrong_answer_3: "Star Wars: The Force Awakens",
		difficulty: "hard",
		category_index: 3,
	},
	// Sports
	{
		question_text: "How many players are on a standard soccer team?",
		correct_answer: "11",
		wrong_answer_1: "9",
		wrong_answer_2: "13",
		wrong_answer_3: "7",
		difficulty: "easy",
		category_index: 4,
	},
	{
		question_text: "In which sport would you perform a 'slam dunk'?",
		correct_answer: "Basketball",
		wrong_answer_1: "Volleyball",
		wrong_answer_2: "Handball",
		wrong_answer_3: "Water Polo",
		difficulty: "easy",
		category_index: 4,
	},
	{
		question_text: "How many Grand Slam tennis tournaments are held each year?",
		correct_answer: "4",
		wrong_answer_1: "2",
		wrong_answer_2: "6",
		wrong_answer_3: "3",
		difficulty: "easy",
		category_index: 4,
	},
	{
		question_text: "Which country has won the most FIFA World Cups?",
		correct_answer: "Brazil",
		wrong_answer_1: "Germany",
		wrong_answer_2: "Italy",
		wrong_answer_3: "Argentina",
		difficulty: "medium",
		category_index: 4,
	},
	{
		question_text: "How many rings are on the Olympic flag?",
		correct_answer: "5",
		wrong_answer_1: "4",
		wrong_answer_2: "6",
		wrong_answer_3: "7",
		difficulty: "easy",
		category_index: 4,
	},
];

export const Route = createFileRoute("/api/seed")({
	server: {
		handlers: {
			POST: async () => {
				// Check if already seeded
				const [{ value: categoryCount }] = await db
					.select({ value: count() })
					.from(categories);

				if (categoryCount > 0) {
					return Response.json({ message: "Already seeded", seeded: false });
				}

				// Insert categories
				const insertedCategories = await db
					.insert(categories)
					.values(SEED_CATEGORIES.map(({ name, emoji }) => ({ name, emoji })))
					.returning();

				// Insert questions mapped to category IDs
				const questionsToInsert = SEED_QUESTIONS.map((q) => ({
					category_id: insertedCategories[q.category_index].id,
					question_text: q.question_text,
					correct_answer: q.correct_answer,
					wrong_answer_1: q.wrong_answer_1,
					wrong_answer_2: q.wrong_answer_2,
					wrong_answer_3: q.wrong_answer_3,
					difficulty: q.difficulty,
				}));

				await db.insert(questions).values(questionsToInsert);

				return Response.json({
					message: "Seeded successfully",
					seeded: true,
					categories: insertedCategories.length,
					questions: questionsToInsert.length,
				});
			},
		},
	},
});
