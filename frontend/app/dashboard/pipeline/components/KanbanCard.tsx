'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { GripVertical, User, Mail, Phone, DollarSign, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { Contact } from '../types';

interface KanbanCardProps {
  contact: Contact;
  onOpenActions: (contact: Contact, event: React.MouseEvent) => void;
}

export function KanbanCard({ contact, onOpenActions }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: contact.id,
    data: {
      type: 'contact',
      contact,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      className={`
        bg-white border border-gray-200 p-3 cursor-grab active:cursor-grabbing
        hover:border-[#00ff88] transition-colors group
        ${isDragging ? 'shadow-lg ring-2 ring-[#00ff88]/50' : ''}
      `}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1 text-gray-300 group-hover:text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {contact.avatar ? (
                <Image
                  src={contact.avatar}
                  alt={contact.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <h4 className="font-semibold text-sm text-black truncate">
                {contact.name}
              </h4>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenActions(contact, e);
              }}
              className="p-1 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="mt-2 space-y-1">
            {contact.email && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="w-3 h-3" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.dealValue && contact.dealValue > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <DollarSign className="w-3 h-3" />
                <span>{formatCurrency(contact.dealValue)}</span>
              </div>
            )}
          </div>

          {contact.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {contact.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {contact.tags.length > 3 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                  +{contact.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
