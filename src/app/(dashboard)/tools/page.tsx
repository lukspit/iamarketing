import { Wrench } from "lucide-react";

export default function ToolsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Wrench className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Ferramentas</h2>
      <p className="max-w-md text-center text-sm">
        Em breve: gerador de copy, construtor de oferta irresistível, analisador
        de concorrência e planejador de funil.
      </p>
    </div>
  );
}
