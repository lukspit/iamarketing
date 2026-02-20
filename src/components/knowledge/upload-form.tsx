"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadFormProps {
  onUploadComplete?: () => void;
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.name.toLowerCase().endsWith(".pdf")) {
      setFile(selected);
      setStatus("idle");
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setMessage("Processando PDF... Extraindo texto, gerando embeddings...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setStatus("success");
      setMessage(`${data.chunkCount} chunks criados com sucesso!`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onUploadComplete?.();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Erro ao processar PDF"
      );
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Adicionar Conteúdo
      </h3>

      <div className="space-y-4">
        <div
          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary/50 hover:bg-accent/50"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Clique para selecionar um PDF
            </p>
            <p className="text-xs text-muted-foreground">
              Playbooks, livros, artigos em PDF
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {file && (
          <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-3">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={status === "uploading"}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Ingerir"
              )}
            </Button>
          </div>
        )}

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
              status === "success"
                ? "bg-green-500/10 text-green-400"
                : status === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-accent/50 text-muted-foreground"
            }`}
          >
            {status === "success" && <CheckCircle2 className="h-4 w-4" />}
            {status === "error" && <XCircle className="h-4 w-4" />}
            {status === "uploading" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {message}
          </div>
        )}
      </div>
    </Card>
  );
}
