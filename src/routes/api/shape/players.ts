import { createFileRoute } from "@tanstack/react-router";
import { proxyElectricRequest } from "@/lib/electric-proxy";

export const Route = createFileRoute("/api/shape/players")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				return proxyElectricRequest(request, "players");
			},
		},
	},
});
