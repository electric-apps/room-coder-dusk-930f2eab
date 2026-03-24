import {
	Box,
	Button,
	Card,
	Container,
	Flex,
	Heading,
	Separator,
	Text,
	TextField,
} from "@radix-ui/themes";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, Plus, Zap } from "lucide-react";
import { useState } from "react";
import { gameRoomsCollection } from "@/db/collections/game-rooms";
import { playersCollection } from "@/db/collections/players";

export const Route = createFileRoute("/")({
	component: HomePage,
	ssr: false,
	loader: async () => {
		// Seed data on first load
		await fetch("/api/seed", { method: "POST" }).catch(() => {});
	},
});

function generateRoomCode(): string {
	return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function HomePage() {
	const navigate = useNavigate();

	const [hostName, setHostName] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const [joinName, setJoinName] = useState("");
	const [creating, setCreating] = useState(false);
	const [joining, setJoining] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCreateRoom = async () => {
		if (!hostName.trim()) {
			setError("Please enter your name");
			return;
		}
		setCreating(true);
		setError(null);
		try {
			const code = generateRoomCode();
			const roomId = crypto.randomUUID();
			const playerId = crypto.randomUUID();
			const now = new Date();

			const roomTx = gameRoomsCollection.insert({
				id: roomId,
				code,
				host_name: hostName.trim(),
				status: "waiting",
				current_question_id: null,
				question_started_at: null,
				round_number: 0,
				total_rounds: 5,
				created_at: now,
				updated_at: now,
			});

			const playerTx = playersCollection.insert({
				id: playerId,
				room_id: roomId,
				name: hostName.trim(),
				score: 0,
				is_ready: false,
				created_at: now,
				updated_at: now,
			});

			await Promise.all([
				roomTx.isPersisted.promise,
				playerTx.isPersisted.promise,
			]);

			sessionStorage.setItem(
				`trivia_player_${code}`,
				JSON.stringify({ playerId, isHost: true }),
			);
			navigate({ to: "/room/$code", params: { code } });
		} catch {
			setError("Failed to create room. Please try again.");
			setCreating(false);
		}
	};

	const handleJoinRoom = async () => {
		if (!joinCode.trim() || !joinName.trim()) {
			setError("Please enter both a room code and your name");
			return;
		}
		setJoining(true);
		setError(null);
		try {
			const code = joinCode.trim().toUpperCase();
			const playerId = crypto.randomUUID();
			// We'll insert the player optimistically; the room page will validate
			// We need to find the room first, but since collections sync async,
			// navigate to the room page and let it handle validation
			sessionStorage.setItem(
				`trivia_pending_join_${code}`,
				JSON.stringify({ playerId, name: joinName.trim() }),
			);
			navigate({ to: "/room/$code", params: { code } });
		} catch {
			setError("Failed to join room. Please try again.");
			setJoining(false);
		}
	};

	return (
		<Box py="9" style={{ minHeight: "calc(100vh - 57px)" }}>
			<Container size="2">
				{/* Hero */}
				<Flex direction="column" align="center" gap="3" mb="9">
					<Flex align="center" gap="2">
						<Zap size={40} style={{ color: "var(--violet-9)" }} />
						<Heading
							size="9"
							className="game-logo"
							style={{ letterSpacing: "-2px" }}
						>
							TriviaBlast
						</Heading>
					</Flex>
					<Text size="4" color="gray" align="center">
						Real-time multiplayer trivia for you and your friends
					</Text>
					<Flex gap="3" mt="1">
						<Text size="2" color="violet">
							⚡ Live sync
						</Text>
						<Text size="2" color="gray">
							·
						</Text>
						<Text size="2" color="violet">
							🏆 Live leaderboard
						</Text>
						<Text size="2" color="gray">
							·
						</Text>
						<Text size="2" color="violet">
							⏱ Timed rounds
						</Text>
					</Flex>
				</Flex>

				{error && (
					<Box mb="4">
						<Text color="red" size="2">
							{error}
						</Text>
					</Box>
				)}

				<Flex gap="4" direction={{ initial: "column", sm: "row" }}>
					{/* Create Room */}
					<Card style={{ flex: 1 }}>
						<Flex direction="column" gap="4" p="2">
							<Flex align="center" gap="2">
								<Box
									style={{
										background: "var(--violet-9)",
										borderRadius: "50%",
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<Plus size={18} color="white" />
								</Box>
								<Heading size="5">Host a Game</Heading>
							</Flex>
							<Text size="2" color="gray">
								Create a room, share the code with friends, and start the game
								when everyone's ready.
							</Text>
							<Separator size="4" />
							<Flex direction="column" gap="3">
								<Box>
									<Text
										as="label"
										size="2"
										weight="medium"
										mb="1"
										style={{ display: "block" }}
									>
										Your name
									</Text>
									<TextField.Root
										placeholder="Enter your name"
										value={hostName}
										onChange={(e) => setHostName(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
										size="3"
									/>
								</Box>
								<Button
									size="3"
									onClick={handleCreateRoom}
									loading={creating}
									disabled={creating}
								>
									<Zap size={16} />
									Create Room
								</Button>
							</Flex>
						</Flex>
					</Card>

					{/* Join Room */}
					<Card style={{ flex: 1 }}>
						<Flex direction="column" gap="4" p="2">
							<Flex align="center" gap="2">
								<Box
									style={{
										background: "var(--teal-9)",
										borderRadius: "50%",
										width: 36,
										height: 36,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<LogIn size={18} color="white" />
								</Box>
								<Heading size="5">Join a Game</Heading>
							</Flex>
							<Text size="2" color="gray">
								Got a room code from a friend? Enter it below along with your
								name to jump in.
							</Text>
							<Separator size="4" />
							<Flex direction="column" gap="3">
								<Box>
									<Text
										as="label"
										size="2"
										weight="medium"
										mb="1"
										style={{ display: "block" }}
									>
										Room code
									</Text>
									<TextField.Root
										placeholder="ABCD"
										value={joinCode}
										onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
										maxLength={4}
										size="3"
										style={{
											fontFamily: "monospace",
											letterSpacing: "0.2em",
											textTransform: "uppercase",
										}}
									/>
								</Box>
								<Box>
									<Text
										as="label"
										size="2"
										weight="medium"
										mb="1"
										style={{ display: "block" }}
									>
										Your name
									</Text>
									<TextField.Root
										placeholder="Enter your name"
										value={joinName}
										onChange={(e) => setJoinName(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
										size="3"
									/>
								</Box>
								<Button
									size="3"
									variant="surface"
									color="teal"
									onClick={handleJoinRoom}
									loading={joining}
									disabled={joining}
								>
									<LogIn size={16} />
									Join Room
								</Button>
							</Flex>
						</Flex>
					</Card>
				</Flex>

				{/* Footer info */}
				<Flex justify="center" mt="8">
					<Text size="1" color="gray">
						Powered by Electric SQL · Real-time sync across all players
					</Text>
				</Flex>
			</Container>
		</Box>
	);
}
