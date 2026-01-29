'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ArrowRight,
  MessageSquare,
  StickyNote,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Contact, KanbanColumn } from '../types';

interface CardActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  position: { x: number; y: number };
  columns: KanbanColumn[];
  onMoveToColumn: (contactId: string, columnId: string | null) => void;
}

export function CardActionsMenu({
  isOpen,
  onClose,
  contact,
  position,
  columns,
  onMoveToColumn,
}: CardActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!contact) return null;

  // Adjust position to keep menu on screen
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 280),
    y: Math.min(position.y, window.innerHeight - 400),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bg-white border-2 border-black shadow-xl z-[100] min-w-[220px]"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          {/* Contact Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              {contact.avatar ? (
                <Image
                  src={contact.avatar}
                  alt={contact.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-sm text-black truncate">{contact.name}</p>
                {contact.email && (
                  <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => {
                router.push(`/dashboard/clientes/${contact.id}`);
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-3"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              Ver Contato
            </button>

            <button
              onClick={() => {
                // TODO: Implement send message
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-3"
            >
              <MessageSquare className="w-4 h-4 text-gray-500" />
              Enviar Mensagem
            </button>

            <button
              onClick={() => {
                // TODO: Implement add note
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-3"
            >
              <StickyNote className="w-4 h-4 text-gray-500" />
              Adicionar Nota
            </button>

            <button
              onClick={() => {
                router.push('/dashboard/automacoes');
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-gray-50 flex items-center gap-3"
            >
              <Zap className="w-4 h-4 text-gray-500" />
              Iniciar Flow
            </button>
          </div>

          {/* Move to Column */}
          <div className="border-t border-gray-200">
            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase">
              Mover para
            </div>
            <div className="pb-1">
              {columns
                .filter((col) => col.id !== contact.kanbanColumnId)
                .map((column) => (
                  <button
                    key={column.id}
                    onClick={() => {
                      onMoveToColumn(contact.id, column.id);
                      onClose();
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="truncate">{column.name}</span>
                  </button>
                ))}

              {contact.kanbanColumnId && (
                <button
                  onClick={() => {
                    onMoveToColumn(contact.id, null);
                    onClose();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-3"
                >
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300" />
                  <span>Sem Coluna</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
