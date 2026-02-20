"use client";

import { useState } from "react";
import {
  FileText,
  Youtube,
  Globe,
  StickyNote,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KBDocument } from "@/types";

const sourceIcons = {
  pdf: FileText,
  youtube: Youtube,
  article: Globe,
  note: StickyNote,
};

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pendente",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  processing: {
    icon: Loader2,
    label: "Processando",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  completed: {
    icon: CheckCircle2,
    label: "Concluído",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  error: {
    icon: AlertCircle,
    label: "Erro",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

interface DocumentCardProps {
  document: KBDocument;
  onDelete?: () => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [deleting, setDeleting] = useState(false);

  const SourceIcon = sourceIcons[document.source_type] || FileText;
  const status = statusConfig[document.status];
  const StatusIcon = status.icon;

  const handleDelete = async () => {
    if (!confirm(`Remover "${document.title}" da base de conhecimento?`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${document.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete?.();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
        <SourceIcon className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{document.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {document.file_size && <span>{formatSize(document.file_size)}</span>}
          {document.total_chunks > 0 && (
            <>
              <span>·</span>
              <span>{document.total_chunks} chunks</span>
            </>
          )}
          {document.metadata?.total_pages && (
            <>
              <span>·</span>
              <span>{document.metadata.total_pages} páginas</span>
            </>
          )}
          <span>·</span>
          <span>{formatDate(document.created_at)}</span>
        </div>
      </div>

      <Badge variant="outline" className={status.className}>
        <StatusIcon
          className={`mr-1 h-3 w-3 ${document.status === "processing" ? "animate-spin" : ""}`}
        />
        {status.label}
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </Card>
  );
}
