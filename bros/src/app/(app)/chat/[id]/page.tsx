"use client";

import { useParams } from "next/navigation";
import { ChatThread } from "@/components/chat-thread";

export default function ChatThreadPage() {
  const params = useParams<{ id: string }>();
  return <ChatThread conversationId={params.id} />;
}
