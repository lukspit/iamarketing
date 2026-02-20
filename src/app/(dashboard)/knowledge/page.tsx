"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { UploadForm } from "@/components/knowledge/upload-form";
import { DocumentList } from "@/components/knowledge/document-list";

export default function KnowledgePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Base de Conhecimento</h1>
            <p className="text-sm text-muted-foreground">
              Adicione PDFs, artigos e conteúdo para alimentar a IA com
              conhecimento estratégico.
            </p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <UploadForm
            onUploadComplete={() => setRefreshTrigger((t) => t + 1)}
          />
          <DocumentList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
