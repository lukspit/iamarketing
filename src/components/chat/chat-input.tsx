"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Square } from "lucide-react";
import { useRef, type FormEvent, type KeyboardEvent } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onStop: () => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative">
      <Textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pergunta qualquer coisa sobre marketing digital..."
        className="min-h-[56px] resize-none rounded-2xl border-border bg-accent pr-14 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
        rows={1}
      />
      <div className="absolute bottom-2 right-2">
        {isLoading ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onStop}
            className="h-9 w-9 rounded-xl"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim()}
            className="h-9 w-9 rounded-xl"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
