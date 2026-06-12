import { createFileRoute } from "@tanstack/react-router";
import { ChatIndex } from "./chat";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});