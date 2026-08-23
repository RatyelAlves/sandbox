"use client";

import { useParams } from "next/navigation";
import { ChatThread } from "@/components/chat-thread";

export default function ChatComPage() {
  const params = useParams<{ userId: string }>();
  return <ChatThread peerId={params.userId} />;
}
