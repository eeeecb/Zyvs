export interface ImportRow {
  [key: string]: string | undefined;
}

export interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  city?: string;
  state?: string;
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface ImportError {
  line: number;
  field?: string;
  value?: string;
  error: string;
}
