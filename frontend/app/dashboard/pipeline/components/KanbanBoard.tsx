'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn as KanbanColumnType, Contact, PipelineData } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface KanbanBoardProps {
  data: PipelineData;
  onDataChange: (data: PipelineData) => void;
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (column: KanbanColumnType) => void;
  onOpenCardActions: (contact: Contact, event: React.MouseEvent) => void;
}

export function KanbanBoard({
  data,
  onDataChange,
  onEditColumn,
  onDeleteColumn,
  onOpenCardActions,
}: KanbanBoardProps) {
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const contact = active.data.current?.contact as Contact;
    if (contact) {
      setActiveContact(contact);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveContact(null);

      if (!over) return;

      const activeContact = active.data.current?.contact as Contact;
      if (!activeContact) return;

      // Determine the target column
      let targetColumnId: string | null = null;

      if (over.data.current?.type === 'column') {
        targetColumnId = over.id as string;
      } else if (over.data.current?.type === 'contact') {
        // Dropped on another contact - find its column
        const overContact = over.data.current?.contact as Contact;
        targetColumnId = overContact.kanbanColumnId || null;
      }

      // If dropped on the same column, do nothing
      if (activeContact.kanbanColumnId === targetColumnId) return;

      // Optimistic update
      const newContactsByColumn = { ...data.contactsByColumn };

      // Remove from source column
      const sourceColumnId = activeContact.kanbanColumnId || 'null';
      newContactsByColumn[sourceColumnId] = (newContactsByColumn[sourceColumnId] || []).filter(
        (c) => c.id !== activeContact.id
      );

      // Add to target column
      const destColumnId = targetColumnId || 'null';
      if (!newContactsByColumn[destColumnId]) {
        newContactsByColumn[destColumnId] = [];
      }
      const updatedContact = { ...activeContact, kanbanColumnId: targetColumnId };
      newContactsByColumn[destColumnId] = [updatedContact, ...newContactsByColumn[destColumnId]];

      // Update UI immediately
      onDataChange({
        ...data,
        contactsByColumn: newContactsByColumn,
      });

      // Make API call
      try {
        await api.patch(`/api/kanban/contacts/${activeContact.id}/move`, {
          columnId: targetColumnId,
        });
      } catch (error: unknown) {
        // Revert on error
        onDataChange(data);
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error('Erro ao mover contato', {
          description: errorMessage || 'Tente novamente',
        });
      }
    },
    [data, onDataChange]
  );

  // Create a virtual "Inbox" column for contacts without a column
  const inboxContacts = data.contactsByColumn['null'] || [];
  const hasInboxContacts = inboxContacts.length > 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {/* Show inbox column only if there are contacts without a column */}
        {hasInboxContacts && (
          <KanbanColumn
            key="inbox"
            column={{
              id: 'null',
              name: 'Inbox',
              color: '#6b7280',
              order: -1,
              isDefault: false,
              isFinal: false,
              isActive: true,
              contactsCount: inboxContacts.length,
            }}
            contacts={inboxContacts}
            onEditColumn={() => {}}
            onDeleteColumn={() => {}}
            onOpenCardActions={onOpenCardActions}
          />
        )}

        {data.columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            contacts={data.contactsByColumn[column.id] || []}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
            onOpenCardActions={onOpenCardActions}
          />
        ))}
      </div>

      <DragOverlay>
        {activeContact && (
          <div className="rotate-3 opacity-90">
            <KanbanCard
              contact={activeContact}
              onOpenActions={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
