import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Settings className="h-12 w-12" />
      <h2 className="text-xl font-semibold text-foreground">Configurações</h2>
      <p className="max-w-md text-center text-sm">
        Em breve: configure sua API key, personalize o system prompt e ajuste
        preferências.
      </p>
    </div>
  );
}
