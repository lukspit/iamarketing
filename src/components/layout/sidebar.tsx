"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  BookOpen,
  LayoutTemplate,
  Wrench,
  Settings,
  Plus,
  Zap,
} from "lucide-react";

const navigation = [
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Base de Conhecimento", href: "/knowledge", icon: BookOpen },
  { title: "Templates", href: "/templates", icon: LayoutTemplate },
  { title: "Ferramentas", href: "/tools", icon: Wrench },
  { title: "Configurações", href: "/settings", icon: Settings },
];

interface SidebarProps {
  conversations: { id: string; title: string }[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none">IA Marketing</h1>
          <p className="text-xs text-muted-foreground">A Malícia do Mercado</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 py-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 text-sm",
                  isActive && "font-medium"
                )}
                size="sm"
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Nova conversa
        </Button>
      </div>

      {/* Conversation History */}
      <ScrollArea className="flex-1 px-3">
        <div className="flex flex-col gap-1 pb-3">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
                conv.id === currentConversationId
                  ? "bg-accent font-medium text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className="line-clamp-1">{conv.title}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
