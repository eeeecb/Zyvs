'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Tag as TagIcon, DollarSign, Calendar, RotateCcw } from 'lucide-react';
import { PipelineFilters, Tag } from '../types';
import { api } from '@/lib/api';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PipelineFilters;
  onApply: (filters: PipelineFilters) => void;
}

export function FilterPanel({ isOpen, onClose, filters, onApply }: FilterPanelProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [minDealValue, setMinDealValue] = useState<string>('');
  const [maxDealValue, setMaxDealValue] = useState<string>('');
  const [createdAfter, setCreatedAfter] = useState<string>('');
  const [createdBefore, setCreatedBefore] = useState<string>('');

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Initialize from current filters
      setSelectedTagIds(filters.tagIds?.split(',').filter(Boolean) || []);
      setMinDealValue(filters.minDealValue?.toString() || '');
      setMaxDealValue(filters.maxDealValue?.toString() || '');
      setCreatedAfter(filters.createdAfter || '');
      setCreatedBefore(filters.createdBefore || '');
    }
  }, [isOpen, filters]);

  const loadTags = async () => {
    try {
      const response = await api.get('/api/tags');
      setTags(response.data.tags || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleApply = () => {
    const newFilters: PipelineFilters = {};

    if (selectedTagIds.length > 0) {
      newFilters.tagIds = selectedTagIds.join(',');
    }
    if (minDealValue) {
      newFilters.minDealValue = parseFloat(minDealValue);
    }
    if (maxDealValue) {
      newFilters.maxDealValue = parseFloat(maxDealValue);
    }
    if (createdAfter) {
      newFilters.createdAfter = createdAfter;
    }
    if (createdBefore) {
      newFilters.createdBefore = createdBefore;
    }

    onApply(newFilters);
    onClose();
  };

  const handleReset = () => {
    setSelectedTagIds([]);
    setMinDealValue('');
    setMaxDealValue('');
    setCreatedAfter('');
    setCreatedBefore('');
    onApply({});
    onClose();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const hasActiveFilters =
    selectedTagIds.length > 0 || minDealValue || maxDealValue || createdAfter || createdBefore;

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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white border-l-2 border-black shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b-2 border-black px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <h2 className="text-xl font-bold text-black">Filtros</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 transition">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Tags */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TagIcon className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-bold text-black">Tags</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma tag encontrada</p>
                  ) : (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          px-3 py-1.5 text-sm font-semibold border-2 transition
                          ${
                            selectedTagIds.includes(tag.id)
                              ? 'border-black bg-[#00ff88]'
                              : 'border-gray-300 hover:border-gray-400'
                          }
                        `}
                        style={{
                          backgroundColor: selectedTagIds.includes(tag.id)
                            ? undefined
                            : `${tag.color}15`,
                        }}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Deal Value */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-bold text-black">Valor do Negocio</label>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Minimo</label>
                    <input
                      type="number"
                      value={minDealValue}
                      onChange={(e) => setMinDealValue(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border-2 border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Maximo</label>
                    <input
                      type="number"
                      value={maxDealValue}
                      onChange={(e) => setMaxDealValue(e.target.value)}
                      placeholder="99999"
                      className="w-full px-3 py-2 border-2 border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-bold text-black">Data de Criacao</label>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">De</label>
                    <input
                      type="date"
                      value={createdAfter}
                      onChange={(e) => setCreatedAfter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Ate</label>
                    <input
                      type="date"
                      value={createdBefore}
                      onChange={(e) => setCreatedBefore(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t-2 border-black px-6 py-4 flex gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 font-bold text-sm hover:bg-gray-50 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-4 py-2.5 bg-[#00ff88] border-2 border-black font-bold text-sm hover:bg-[#00dd77] transition"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
