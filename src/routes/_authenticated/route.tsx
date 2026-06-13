import { createFileRoute, Outlet } from "@tanstack/react-router";

// Auth temporarily disabled for UI testing.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});