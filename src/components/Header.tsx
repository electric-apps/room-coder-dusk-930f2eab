import { Flex, Text } from "@radix-ui/themes";
import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export function Header() {
	return (
		<header style={{ borderBottom: "1px solid var(--gray-6)" }}>
			<Flex align="center" justify="between" py="3" px="4">
				<Link to="/" style={{ textDecoration: "none" }}>
					<Flex align="center" gap="2">
						<Zap size={20} style={{ color: "var(--violet-9)" }} />
						<Text
							size="5"
							weight="bold"
							style={{
								fontFamily: "var(--heading-font)",
								letterSpacing: "-0.5px",
							}}
						>
							TriviaBlast
						</Text>
					</Flex>
				</Link>
			</Flex>
		</header>
	);
}
