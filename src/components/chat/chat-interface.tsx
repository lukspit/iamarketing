"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { Zap } from "lucide-react";

export function ChatInterface() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, stop, status } = useChat({
    transport,
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    sendMessage({ text: suggestion });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading &&
                messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                    <span className="text-sm">Pensando...</span>
                  </div>
                )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void;
}) {
  const suggestions = [
    "Como criar uma oferta irresistível pro meu infoproduto?",
    "Me ajuda a montar um funil de vendas pra SaaS",
    "Escreve uma copy de página de vendas pra um curso de finanças",
    "Qual a melhor estratégia de lançamento pra quem tem pouca audiência?",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center py-24">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Zap className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mb-2 text-2xl font-bold">IA Marketing Digital</h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        Sua IA com a malícia do mercado. Pergunte sobre copy, funis,
        posicionamento, infoprodutos, SaaS — tudo que envolve vender na
        internet.
      </p>
      <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-lg border border-border p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
