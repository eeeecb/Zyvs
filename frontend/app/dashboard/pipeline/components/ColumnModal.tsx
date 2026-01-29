'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { KanbanColumn } from '../types';

interface ColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    color: string;
    isDefault?: boolean;
    isFinal?: boolean;
  }) => Promise<void>;
  column?: KanbanColumn | null;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Green
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6b7280', // Gray
];

export function ColumnModal({ isOpen, onClose, onSave, column }: ColumnModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [isDefault, setIsDefault] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setColor(column.color);
      setIsDefault(column.isDefault);
      setIsFinal(column.isFinal);
    } else {
      setName('');
      setColor('#6366f1');
      setIsDefault(false);
      setIsFinal(false);
    }
  }, [column, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSave({ name: name.trim(), color, isDefault, isFinal });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md border-2 border-black shadow-2xl"
            >
              {/* Header */}
              <div className="border-b-2 border-black px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-black">
                  {column ? 'Editar Coluna' : 'Nova Coluna'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Nome da Coluna
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Qualificação"
                    className="w-full px-4 py-2.5 border-2 border-black focus:outline-none focus:border-[#00ff88] text-sm"
                    required
                    maxLength={50}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Cor
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((presetColor) => (
                        <button
                          key={presetColor}
                          type="button"
                          onClick={() => setColor(presetColor)}
                          className={`
                            w-8 h-8 rounded-full transition-all
                            ${color === presetColor ? 'ring-2 ring-offset-2 ring-black scale-110' : ''}
                          `}
                          style={{ backgroundColor: presetColor }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 cursor-pointer border-2 border-gray-300"
                    />
                  </div>
                </div>

                {/* Flags */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="w-5 h-5 border-2 border-black accent-[#00ff88]"
                    />
                    <div>
                      <span className="font-semibold text-sm text-black">
                        Coluna Inicial
                      </span>
                      <p className="text-xs text-gray-500">
                        Novos contatos entram nesta coluna
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFinal}
                      onChange={(e) => setIsFinal(e.target.checked)}
                      className="w-5 h-5 border-2 border-black accent-[#00ff88]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-black">
                        Coluna Final
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <p className="text-xs text-gray-500">
                        Indica negociacao fechada
                      </p>
                    </div>
                  </label>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Preview
                  </label>
                  <div
                    className="border-2 border-black p-3"
                    style={{ borderTopColor: color, borderTopWidth: '4px' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{name || 'Nome da Coluna'}</span>
                      {isFinal && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-600 rounded-full">
                        0
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border-2 border-black font-bold text-sm hover:bg-gray-50 transition"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 px-4 py-2.5 bg-[#00ff88] border-2 border-black font-bold text-sm hover:bg-[#00dd77] transition disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : column ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
