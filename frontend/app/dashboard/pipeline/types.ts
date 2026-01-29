export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  dealValue?: number | null;
  kanbanColumnId?: string | null;
  createdAt: string;
  tags: Tag[];
}

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isFinal: boolean;
  isActive: boolean;
  contactsCount: number;
}

export interface PipelineData {
  columns: KanbanColumn[];
  contactsByColumn: Record<string, Contact[]>;
  totalContacts: number;
}

export interface PipelineFilters {
  search?: string;
  tagIds?: string;
  minDealValue?: number;
  maxDealValue?: number;
  createdAfter?: string;
  createdBefore?: string;
}
