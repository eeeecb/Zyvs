'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { MoreVertical, CheckCircle2, Inbox } from 'lucide-react';
import { KanbanColumn as KanbanColumnType, Contact } from '../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnType;
  contacts: Contact[];
  onEditColumn: (column: KanbanColumnType) => void;
  onDeleteColumn: (column: KanbanColumnType) => void;
  onOpenCardActions: (contact: Contact, event: React.MouseEvent) => void;
}

export function KanbanColumn({
  column,
  contacts,
  onEditColumn,
  onDeleteColumn,
  onOpenCardActions,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const totalValue = contacts.reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
  const isInboxColumn = column.id === 'null';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="flex-shrink-0 w-[300px]">
      {/* Header */}
      <div
        className="bg-white border-2 border-black p-3 mb-2"
        style={{ borderTopColor: column.color, borderTopWidth: '4px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isInboxColumn && <Inbox className="w-4 h-4 text-gray-500" />}
            <h3 className="font-bold text-sm text-black">{column.name}</h3>
            {column.isFinal && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-full">
              {contacts.length}
            </span>
          </div>

          {!isInboxColumn && (
            <div className="relative group">
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                <button
                  onClick={() => onEditColumn(column)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDeleteColumn(column)}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Deletar
                </button>
              </div>
            </div>
          )}
        </div>

        {totalValue > 0 && (
          <div className="mt-2 text-xs font-semibold text-green-600">
            Total: {formatCurrency(totalValue)}
          </div>
        )}
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto
          p-2 border-2 border-dashed transition-colors
          ${isOver ? 'border-[#00ff88] bg-[#00ff88]/5' : 'border-gray-200'}
        `}
      >
        <SortableContext
          items={contacts.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Arraste contatos aqui
              </div>
            ) : (
              contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <KanbanCard
                    contact={contact}
                    onOpenActions={onOpenCardActions}
                  />
                </motion.div>
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
