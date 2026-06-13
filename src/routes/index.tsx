import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PetVet — Pet Health Journal" },
      { name: "description", content: "A calm pet health journal with an AI care companion." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/home", replace: true });
  },
  component: () => null,
});
