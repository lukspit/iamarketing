import { LayoutTemplate } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <LayoutTemplate className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Templates</h2>
      <p className="max-w-md text-center text-sm">
        Em breve: templates prontos para gerar copies, estruturar funis, criar
        emails de venda, scripts de vídeo e muito mais.
      </p>
    </div>
  );
}
