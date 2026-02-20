"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Database } from "lucide-react";
import { DocumentCard } from "./document-card";
import type { KBDocument } from "@/types";

interface DocumentListProps {
  refreshTrigger?: number;
}

export function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<KBDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Database className="h-10 w-10" />
        <p className="text-sm">Nenhum documento na base de conhecimento</p>
        <p className="text-xs">
          Faça upload de PDFs acima para alimentar a IA
        </p>
      </div>
    );
  }

  const totalChunks = documents.reduce((sum, d) => sum + d.total_chunks, 0);
  const completedDocs = documents.filter((d) => d.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documentos ({completedDocs} ativos)
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalChunks} chunks totais
        </span>
      </div>

      <div className="space-y-2">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onDelete={fetchDocuments}
          />
        ))}
      </div>
    </div>
  );
}
