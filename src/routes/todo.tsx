import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/todo")({
  beforeLoad: () => {
    throw redirect({ to: "/goal" });
  },
});
