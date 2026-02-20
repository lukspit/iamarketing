export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface KBDocument {
  id: string;
  title: string;
  source_type: "pdf" | "youtube" | "article" | "note";
  file_name: string | null;
  file_size: number | null;
  total_chunks: number;
  status: "pending" | "processing" | "completed" | "error";
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
