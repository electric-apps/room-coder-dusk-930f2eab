import {
	Badge,
	Box,
	Button,
	Card,
	Container,
	Flex,
	Heading,
	Progress,
	Separator,
	Text,
} from "@radix-ui/themes";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	CheckCircle,
	Clock,
	Copy,
	Crown,
	LogOut,
	Play,
	Trophy,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { answersCollection } from "@/db/collections/answers";
import { gameRoomsCollection } from "@/db/collections/game-rooms";
import { playersCollection } from "@/db/collections/players";
import { questionsCollection } from "@/db/collections/questions";
import type { GameRoom, Player, Question } from "@/db/zod-schemas";

export const Route = createFileRoute("/room/$code")({
	ssr: false,
	component: RoomPage,
});

const QUESTION_TIME = 20; // seconds
const MAX_POINTS = 1000;
const MIN_POINTS = 100;

function calcPoints(
	startedAt: Date | string | null,
	isCorrect: boolean,
): number {
	if (!isCorrect || !startedAt) return 0;
	const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
	const ratio = Math.max(0, Math.min(1, elapsed / QUESTION_TIME));
	return Math.max(MIN_POINTS, Math.round(MAX_POINTS * (1 - ratio)));
}

// Seeded shuffle using question id as seed (deterministic for all players)
function seededShuffle(items: string[], seed: string): string[] {
	const arr = [...items];
	// Simple seeded sort based on hash of seed + index
	const hash = (s: string) =>
		s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
	return arr.sort((a, b) => hash(seed + a) - hash(seed + b));
}

function getAnswersForQuestion(question: Question): string[] {
	return seededShuffle(
		[
			question.correct_answer,
			question.wrong_answer_1,
			question.wrong_answer_2,
			question.wrong_answer_3,
		],
		question.id,
	);
}

type PlayerSession = { playerId: string; isHost: boolean };
type PendingJoin = { playerId: string; name: string };

function getSession(code: string): PlayerSession | null {
	try {
		const raw = sessionStorage.getItem(`trivia_player_${code}`);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function getPendingJoin(code: string): PendingJoin | null {
	try {
		const raw = sessionStorage.getItem(`trivia_pending_join_${code}`);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function RoomPage() {
	const { code } = Route.useParams();
	const navigate = useNavigate();
	const [session, setSession] = useState<PlayerSession | null>(null);
	const [joiningRoom, setJoiningRoom] = useState(false);
	const joinAttempted = useRef(false);

	// Query collections
	const { data: rooms, isLoading: roomsLoading } = useLiveQuery(
		(q) =>
			q
				.from({ room: gameRoomsCollection })
				.where(({ room }) => eq(room.code, code)),
		[code],
	);

	const room = rooms?.[0] as GameRoom | undefined;

	const { data: players } = useLiveQuery(
		(q) => {
			if (!room?.id) return undefined;
			return q
				.from({ player: playersCollection })
				.where(({ player }) => eq(player.room_id, room.id))
				.orderBy(({ player }) => player.created_at, "asc");
		},
		[room?.id],
	);

	const { data: questions } = useLiveQuery(
		(q) => q.from({ question: questionsCollection }),
		[],
	);

	const { data: currentAnswers } = useLiveQuery(
		(q) => {
			if (!room?.id || !room.current_question_id) return undefined;
			return q
				.from({ answer: answersCollection })
				.where(({ answer }) => eq(answer.room_id, room.id));
		},
		[room?.id, room?.current_question_id],
	);

	// Handle joining room via pending join
	useEffect(() => {
		if (joinAttempted.current) return;
		const existingSession = getSession(code);
		if (existingSession) {
			setSession(existingSession);
			return;
		}
		const pending = getPendingJoin(code);
		if (!pending || !room || joiningRoom) return;

		joinAttempted.current = true;
		setJoiningRoom(true);

		const now = new Date();
		const playerTx = playersCollection.insert({
			id: pending.playerId,
			room_id: room.id,
			name: pending.name,
			score: 0,
			is_ready: false,
			created_at: now,
			updated_at: now,
		});

		playerTx.isPersisted.promise
			.then(() => {
				const newSession: PlayerSession = {
					playerId: pending.playerId,
					isHost: false,
				};
				sessionStorage.setItem(
					`trivia_player_${code}`,
					JSON.stringify(newSession),
				);
				sessionStorage.removeItem(`trivia_pending_join_${code}`);
				setSession(newSession);
				setJoiningRoom(false);
			})
			.catch(() => {
				setJoiningRoom(false);
			});
	}, [room, code, joiningRoom]);

	// Set session from storage on load
	useEffect(() => {
		const s = getSession(code);
		if (s) setSession(s);
	}, [code]);

	if (roomsLoading) {
		return (
			<Container size="2" py="9">
				<Flex align="center" justify="center" gap="3">
					<Text color="gray">Connecting to room…</Text>
				</Flex>
			</Container>
		);
	}

	if (!room && !roomsLoading) {
		return (
			<Container size="2" py="9">
				<Flex direction="column" align="center" gap="4">
					<XCircle size={48} style={{ color: "var(--red-9)" }} />
					<Heading size="6">Room not found</Heading>
					<Text color="gray">
						The room code <strong>{code}</strong> doesn't exist.
					</Text>
					<Button onClick={() => navigate({ to: "/" })}>Back to Home</Button>
				</Flex>
			</Container>
		);
	}

	if (joiningRoom || !session) {
		return (
			<Container size="2" py="9">
				<Flex align="center" justify="center" gap="3">
					<Text color="gray">Joining room…</Text>
				</Flex>
			</Container>
		);
	}

	const myPlayer = players?.find((p) => p.id === session.playerId);

	if (room?.status === "waiting") {
		return (
			<LobbyView
				room={room}
				players={players ?? []}
				session={session}
				myPlayer={myPlayer}
				questions={questions ?? []}
			/>
		);
	}

	if (room?.status === "playing") {
		return (
			<GameView
				room={room}
				players={players ?? []}
				session={session}
				myPlayer={myPlayer}
				questions={questions ?? []}
				currentAnswers={currentAnswers ?? []}
			/>
		);
	}

	if (room?.status === "finished") {
		return (
			<ResultsView room={room} players={players ?? []} session={session} />
		);
	}

	return null;
}

// ─────────────────────────────────────────────────────────────
// Lobby
// ─────────────────────────────────────────────────────────────

interface LobbyProps {
	room: GameRoom;
	players: Player[];
	session: PlayerSession;
	myPlayer: Player | undefined;
	questions: Question[];
	code: string;
}

function LobbyView({
	room,
	players,
	session,
	myPlayer,
	questions,
	code,
}: LobbyProps) {
	const [copied, setCopied] = useState(false);
	const [starting, setStarting] = useState(false);

	const copyCode = () => {
		navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const toggleReady = () => {
		if (!myPlayer) return;
		playersCollection.update(myPlayer.id, (draft) => {
			draft.is_ready = !draft.is_ready;
		});
	};

	const startGame = async () => {
		if (questions.length === 0) return;
		setStarting(true);

		// Pick total_rounds questions randomly
		const shuffled = [...questions].sort(() => Math.random() - 0.5);
		const queue = shuffled.slice(0, room.total_rounds).map((q) => q.id);

		const firstQuestionId = queue[0];
		gameRoomsCollection.update(room.id, (draft) => {
			draft.status = "playing";
			draft.current_question_id = firstQuestionId;
			draft.question_started_at = new Date();
			draft.round_number = 1;
			draft.question_queue = JSON.stringify(queue);
			draft.updated_at = new Date();
		});
	};

	const allReady = players.length > 1 && players.every((p) => p.is_ready);

	return (
		<Box className="game-room" py="6">
			<Container size="2">
				<Flex direction="column" gap="6">
					{/* Header */}
					<Flex direction="column" align="center" gap="3">
						<Badge size="2" color="green" variant="soft">
							Waiting for players
						</Badge>
						<Flex align="center" gap="3">
							<Heading
								size="8"
								className="room-code"
								style={{ letterSpacing: "0.3em" }}
							>
								{code}
							</Heading>
							<Button variant="ghost" size="2" onClick={copyCode}>
								<Copy size={16} />
								{copied ? "Copied!" : "Copy"}
							</Button>
						</Flex>
						<Text size="2" color="gray">
							Share this code with friends to invite them
						</Text>
					</Flex>

					{/* Players list */}
					<Card>
						<Flex direction="column" gap="3" p="2">
							<Flex align="center" gap="2">
								<Users size={18} style={{ color: "var(--violet-9)" }} />
								<Text weight="bold" size="3">
									Players ({players.length})
								</Text>
							</Flex>
							<Separator size="4" />
							{players.length === 0 ? (
								<Text color="gray" size="2">
									Waiting for players to join…
								</Text>
							) : (
								<Flex direction="column" gap="2">
									{players.map((p) => (
										<Flex key={p.id} align="center" justify="between">
											<Flex align="center" gap="2">
												{p.name === room.host_name && (
													<Crown
														size={14}
														style={{ color: "var(--yellow-9)" }}
													/>
												)}
												<Text
													size="3"
													weight={
														p.id === session.playerId ? "bold" : "regular"
													}
												>
													{p.name}
													{p.id === session.playerId && " (you)"}
												</Text>
											</Flex>
											{p.is_ready ? (
												<Badge color="green" size="1">
													<CheckCircle size={12} />
													Ready
												</Badge>
											) : (
												<Badge color="gray" size="1" variant="soft">
													Waiting
												</Badge>
											)}
										</Flex>
									))}
								</Flex>
							)}
						</Flex>
					</Card>

					{/* Actions */}
					<Flex direction="column" gap="3" align="center">
						{/* Ready button for non-hosts */}
						{myPlayer && (
							<Button
								size="3"
								variant={myPlayer.is_ready ? "solid" : "surface"}
								color={myPlayer.is_ready ? "green" : "gray"}
								onClick={toggleReady}
								style={{ minWidth: 200 }}
							>
								{myPlayer.is_ready ? (
									<>
										<CheckCircle size={16} /> Ready!
									</>
								) : (
									"Mark as Ready"
								)}
							</Button>
						)}

						{/* Start game button for host */}
						{session.isHost && (
							<Button
								size="3"
								onClick={startGame}
								disabled={
									players.length < 1 || starting || questions.length === 0
								}
								style={{ minWidth: 200 }}
							>
								<Play size={16} />
								{starting
									? "Starting…"
									: allReady
										? "Start Game!"
										: "Start Anyway"}
							</Button>
						)}

						{!session.isHost && !myPlayer?.is_ready && (
							<Text size="2" color="gray">
								Mark yourself as ready, then wait for the host to start.
							</Text>
						)}
					</Flex>

					<Flex justify="center">
						<Text size="1" color="gray">
							{room.total_rounds} questions · 20 seconds each · Max {MAX_POINTS}{" "}
							pts per question
						</Text>
					</Flex>
				</Flex>
			</Container>
		</Box>
	);
}

// ─────────────────────────────────────────────────────────────
// Game Play
// ─────────────────────────────────────────────────────────────

interface GameProps {
	room: GameRoom;
	players: Player[];
	session: PlayerSession;
	myPlayer: Player | undefined;
	questions: Question[];
	currentAnswers: ReturnType<
		typeof answersCollection.getState
	>["data"] extends Map<string, infer T>
		? T[]
		: never[];
}

function GameView({
	room,
	players,
	session,
	myPlayer,
	questions,
	currentAnswers,
}: GameProps) {
	const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [showResult, setShowResult] = useState(false);
	const prevQuestionRef = useRef<string | null>(null);

	const currentQuestion = questions.find(
		(q) => q.id === room.current_question_id,
	);
	const answers = currentQuestion ? getAnswersForQuestion(currentQuestion) : [];

	const myAnswer = currentAnswers.find(
		(a) =>
			a.player_id === session.playerId &&
			a.question_id === room.current_question_id,
	);
	const hasAnswered = !!myAnswer;

	// Reset state when question changes
	useEffect(() => {
		if (room.current_question_id !== prevQuestionRef.current) {
			prevQuestionRef.current = room.current_question_id;
			setSelectedAnswer(null);
			setShowResult(false);
			setTimeLeft(QUESTION_TIME);
		}
	}, [room.current_question_id]);

	// Timer countdown
	useEffect(() => {
		if (!room.question_started_at) return;
		const started = new Date(room.question_started_at).getTime();

		const tick = () => {
			const elapsed = (Date.now() - started) / 1000;
			const remaining = Math.max(0, QUESTION_TIME - elapsed);
			setTimeLeft(remaining);
			if (remaining <= 0) setShowResult(true);
		};

		tick();
		const interval = setInterval(tick, 100);
		return () => clearInterval(interval);
	}, [room.question_started_at]);

	const submitAnswer = (answer: string) => {
		if (hasAnswered || !currentQuestion || !myPlayer) return;
		setSelectedAnswer(answer);
		setShowResult(true);

		const isCorrect = answer === currentQuestion.correct_answer;
		const points = calcPoints(room.question_started_at, isCorrect);

		answersCollection.insert({
			id: crypto.randomUUID(),
			room_id: room.id,
			question_id: currentQuestion.id,
			player_id: myPlayer.id,
			selected_answer: answer,
			is_correct: isCorrect,
			points_earned: points,
			answered_at: new Date(),
		});

		if (isCorrect && points > 0) {
			playersCollection.update(myPlayer.id, (draft) => {
				draft.score = (draft.score ?? 0) + points;
				draft.updated_at = new Date();
			});
		}
	};

	const nextQuestion = () => {
		const queue: string[] = room.question_queue
			? JSON.parse(room.question_queue)
			: [];
		const nextIndex = room.round_number; // round_number is 1-based, index is 0-based
		if (nextIndex >= queue.length) {
			// Game over
			gameRoomsCollection.update(room.id, (draft) => {
				draft.status = "finished";
				draft.updated_at = new Date();
			});
		} else {
			const nextId = queue[nextIndex];
			gameRoomsCollection.update(room.id, (draft) => {
				draft.current_question_id = nextId;
				draft.question_started_at = new Date();
				draft.round_number = (draft.round_number ?? 0) + 1;
				draft.updated_at = new Date();
			});
		}
	};

	// Sort players by score for leaderboard
	const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
	const answeredCount = currentAnswers.filter(
		(a) => a.question_id === room.current_question_id,
	).length;

	const timerPercent = (timeLeft / QUESTION_TIME) * 100;
	const timerColor =
		timeLeft > 10
			? "var(--violet-9)"
			: timeLeft > 5
				? "var(--orange-9)"
				: "var(--red-9)";

	const displayedAnswer = selectedAnswer ?? myAnswer?.selected_answer ?? null;

	return (
		<Box className="game-room" py="4">
			<Container size="3">
				<Flex gap="4" direction={{ initial: "column", md: "row" }}>
					{/* Main game area */}
					<Box style={{ flex: 2 }}>
						<Flex direction="column" gap="4">
							{/* Round info */}
							<Flex align="center" justify="between">
								<Badge size="2" color="violet">
									Question {room.round_number} / {room.total_rounds}
								</Badge>
								<Flex align="center" gap="2">
									<Text size="2" color="gray">
										{answeredCount}/{players.length} answered
									</Text>
								</Flex>
							</Flex>

							{/* Timer */}
							<Card style={{ background: "var(--gray-2)" }}>
								<Flex align="center" gap="3" px="1">
									<Clock
										size={18}
										style={{ color: timerColor, flexShrink: 0 }}
									/>
									<Box style={{ flex: 1 }}>
										<Progress
											value={timerPercent}
											size="3"
											color={
												timeLeft > 10
													? "violet"
													: timeLeft > 5
														? "orange"
														: "red"
											}
										/>
									</Box>
									<Text
										size="4"
										weight="bold"
										style={{
											color: timerColor,
											fontVariantNumeric: "tabular-nums",
											minWidth: 28,
										}}
									>
										{Math.ceil(timeLeft)}
									</Text>
								</Flex>
							</Card>

							{/* Question */}
							{currentQuestion ? (
								<Card>
									<Flex direction="column" gap="4" p="2">
										<Text size="5" weight="bold" style={{ lineHeight: 1.4 }}>
											{currentQuestion.question_text}
										</Text>

										{/* Answer choices */}
										<Flex direction="column" gap="2">
											{answers.map((answer, i) => {
												const letters = ["A", "B", "C", "D"];
												const isSelected = displayedAnswer === answer;
												const isCorrect =
													answer === currentQuestion.correct_answer;
												const isWrong = isSelected && !isCorrect;

												let variant: "solid" | "surface" | "soft" = "surface";
												let color: "violet" | "green" | "red" | "gray" = "gray";

												if (showResult || hasAnswered) {
													if (isCorrect) {
														variant = "solid";
														color = "green";
													} else if (isWrong) {
														variant = "solid";
														color = "red";
													} else {
														variant = "soft";
														color = "gray";
													}
												} else if (isSelected) {
													variant = "solid";
													color = "violet";
												}

												return (
													<Button
														key={answer}
														size="3"
														variant={variant}
														color={color}
														onClick={() => submitAnswer(answer)}
														disabled={
															hasAnswered || showResult || timeLeft <= 0
														}
														className="answer-btn"
														style={{
															justifyContent: "flex-start",
															height: "auto",
															padding: "12px 16px",
														}}
													>
														<Flex align="center" gap="3">
															<Box
																style={{
																	width: 28,
																	height: 28,
																	borderRadius: 6,
																	background: "rgba(255,255,255,0.15)",
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	flexShrink: 0,
																	fontWeight: "bold",
																}}
															>
																{letters[i]}
															</Box>
															<Text size="3" weight="medium">
																{answer}
															</Text>
														</Flex>
													</Button>
												);
											})}
										</Flex>

										{/* Reveal result */}
										{(showResult || hasAnswered) && myAnswer && (
											<Flex
												align="center"
												gap="2"
												p="3"
												style={{
													background: myAnswer.is_correct
														? "var(--green-3)"
														: "var(--red-3)",
													borderRadius: "var(--radius-3)",
												}}
											>
												{myAnswer.is_correct ? (
													<>
														<CheckCircle
															size={18}
															style={{ color: "var(--green-9)" }}
														/>
														<Text
															weight="bold"
															style={{ color: "var(--green-11)" }}
														>
															Correct! +{myAnswer.points_earned} pts
														</Text>
													</>
												) : (
													<>
														<XCircle
															size={18}
															style={{ color: "var(--red-9)" }}
														/>
														<Text
															weight="bold"
															style={{ color: "var(--red-11)" }}
														>
															Wrong — correct answer:{" "}
															{currentQuestion.correct_answer}
														</Text>
													</>
												)}
											</Flex>
										)}

										{timeLeft <= 0 && !hasAnswered && (
											<Flex
												align="center"
												gap="2"
												p="3"
												style={{
													background: "var(--orange-3)",
													borderRadius: "var(--radius-3)",
												}}
											>
												<Clock size={18} style={{ color: "var(--orange-9)" }} />
												<Text
													weight="bold"
													style={{ color: "var(--orange-11)" }}
												>
													Time's up! Correct: {currentQuestion.correct_answer}
												</Text>
											</Flex>
										)}
									</Flex>
								</Card>
							) : (
								<Card>
									<Text color="gray">Loading question…</Text>
								</Card>
							)}

							{/* Host controls */}
							{session.isHost && (showResult || timeLeft <= 0) && (
								<Button size="3" onClick={nextQuestion}>
									{room.round_number >= room.total_rounds
										? "Show Results"
										: "Next Question →"}
								</Button>
							)}
						</Flex>
					</Box>

					{/* Leaderboard sidebar */}
					<Box style={{ flex: 1, minWidth: 200 }}>
						<Card>
							<Flex direction="column" gap="3" p="2">
								<Flex align="center" gap="2">
									<Trophy size={16} style={{ color: "var(--yellow-9)" }} />
									<Text weight="bold" size="3">
										Leaderboard
									</Text>
								</Flex>
								<Separator size="4" />
								{sortedPlayers.map((p, i) => (
									<Flex key={p.id} align="center" justify="between">
										<Flex align="center" gap="2">
											<Text size="2" color="gray" style={{ minWidth: 16 }}>
												{i === 0
													? "🥇"
													: i === 1
														? "🥈"
														: i === 2
															? "🥉"
															: `${i + 1}.`}
											</Text>
											<Text
												size="2"
												weight={p.id === session.playerId ? "bold" : "regular"}
												style={{
													color:
														p.id === session.playerId
															? "var(--violet-11)"
															: undefined,
												}}
											>
												{p.name}
											</Text>
										</Flex>
										<Text size="2" weight="bold">
											{p.score}
										</Text>
									</Flex>
								))}
							</Flex>
						</Card>
					</Box>
				</Flex>
			</Container>
		</Box>
	);
}

// ─────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────

interface ResultsProps {
	room: GameRoom;
	players: Player[];
	session: PlayerSession;
	code: string;
}

function ResultsView({ players, session, code }: ResultsProps) {
	const navigate = useNavigate();
	const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
	const winner = sortedPlayers[0];
	const isWinner = winner?.id === session.playerId;

	const medals = ["🥇", "🥈", "🥉"];

	return (
		<Box className="game-room" py="8">
			<Container size="2">
				<Flex direction="column" gap="6" align="center">
					{/* Winner announcement */}
					<Flex direction="column" align="center" gap="2">
						<Text size="8" style={{ lineHeight: 1 }}>
							🏆
						</Text>
						<Heading size="8" className="game-logo" align="center">
							{isWinner ? "You Won!" : `${winner?.name} Won!`}
						</Heading>
						{isWinner && (
							<Badge size="2" color="yellow">
								Champion with {winner.score} points!
							</Badge>
						)}
					</Flex>

					{/* Final leaderboard */}
					<Card style={{ width: "100%" }}>
						<Flex direction="column" gap="3" p="2">
							<Flex align="center" gap="2">
								<Trophy size={18} style={{ color: "var(--yellow-9)" }} />
								<Heading size="4">Final Standings</Heading>
							</Flex>
							<Separator size="4" />
							{sortedPlayers.map((p, i) => (
								<Flex key={p.id} align="center" justify="between" py="1">
									<Flex align="center" gap="3">
										<Text size="4">{medals[i] ?? `${i + 1}.`}</Text>
										<Flex direction="column">
											<Text
												size="3"
												weight={p.id === session.playerId ? "bold" : "regular"}
												style={{
													color:
														p.id === session.playerId
															? "var(--violet-11)"
															: undefined,
												}}
											>
												{p.name}
												{p.id === session.playerId && " (you)"}
											</Text>
										</Flex>
									</Flex>
									<Flex align="center" gap="2">
										<Text size="4" weight="bold">
											{p.score}
										</Text>
										<Text size="2" color="gray">
											pts
										</Text>
									</Flex>
								</Flex>
							))}
						</Flex>
					</Card>

					{/* Actions */}
					<Flex gap="3">
						<Button
							size="3"
							variant="surface"
							onClick={() => navigate({ to: "/" })}
						>
							<LogOut size={16} />
							Back to Home
						</Button>
					</Flex>

					<Text size="1" color="gray">
						Room code: <span className="room-code">{code}</span>
					</Text>
				</Flex>
			</Container>
		</Box>
	);
}
