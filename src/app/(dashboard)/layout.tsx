"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState<
    { id: string; title: string }[]
  >([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);

  const handleNewChat = () => {
    const id = crypto.randomUUID();
    setConversations((prev) => [
      { id, title: "Nova conversa" },
      ...prev,
    ]);
    setCurrentConversationId(id);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={handleNewChat}
        onSelectConversation={setCurrentConversationId}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
