'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Columns3,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { KanbanBoard } from './components/KanbanBoard';
import { ColumnModal } from './components/ColumnModal';
import { FilterPanel } from './components/FilterPanel';
import { CardActionsMenu } from './components/CardActionsMenu';
import {
  PipelineData,
  PipelineFilters,
  KanbanColumn,
  Contact,
} from './types';

export default function PipelinePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PipelineData>({
    columns: [],
    contactsByColumn: {},
    totalContacts: 0,
  });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<PipelineFilters>({});

  // Modals & menus
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [deleteConfirmColumn, setDeleteConfirmColumn] = useState<KanbanColumn | null>(null);

  // Card actions menu
  const [cardActionsOpen, setCardActionsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (search) queryParams.set('search', search);
      if (filters.tagIds) queryParams.set('tagIds', filters.tagIds);
      if (filters.minDealValue) queryParams.set('minDealValue', filters.minDealValue.toString());
      if (filters.maxDealValue) queryParams.set('maxDealValue', filters.maxDealValue.toString());
      if (filters.createdAfter) queryParams.set('createdAfter', filters.createdAfter);
      if (filters.createdBefore) queryParams.set('createdBefore', filters.createdBefore);

      const response = await api.get(`/api/kanban/contacts?${queryParams.toString()}`);
      setData(response.data);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao carregar pipeline', {
        description: axiosError.response?.data?.message || 'Tente novamente',
      });
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup default columns if none exist
  const setupDefaultColumns = async () => {
    try {
      await api.post('/api/kanban/columns/setup-defaults');
      toast.success('Colunas padrao criadas!');
      loadData();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao criar colunas', {
        description: axiosError.response?.data?.message || 'Tente novamente',
      });
    }
  };

  // Create column
  const handleCreateColumn = async (columnData: {
    name: string;
    color: string;
    isDefault?: boolean;
    isFinal?: boolean;
  }) => {
    try {
      await api.post('/api/kanban/columns', columnData);
      toast.success('Coluna criada!');
      loadData();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao criar coluna', {
        description: axiosError.response?.data?.message || 'Tente novamente',
      });
      throw error;
    }
  };

  // Update column
  const handleUpdateColumn = async (columnData: {
    name: string;
    color: string;
    isDefault?: boolean;
    isFinal?: boolean;
  }) => {
    if (!editingColumn) return;

    try {
      await api.put(`/api/kanban/columns/${editingColumn.id}`, columnData);
      toast.success('Coluna atualizada!');
      loadData();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao atualizar coluna', {
        description: axiosError.response?.data?.message || 'Tente novamente',
      });
      throw error;
    }
  };

  // Delete column
  const handleDeleteColumn = async (column: KanbanColumn) => {
    try {
      await api.delete(`/api/kanban/columns/${column.id}`);
      toast.success('Coluna deletada!');
      setDeleteConfirmColumn(null);
      loadData();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao deletar coluna', {
        description: axiosError.response?.data?.message || 'Tente novamente',
      });
    }
  };

  // Move contact to column
  const handleMoveContact = async (contactId: string, columnId: string | null) => {
    // Find the contact in current data
    let contact: Contact | null = null;
    let sourceColumnId: string = 'null';

    for (const [colId, contacts] of Object.entries(data.contactsByColumn)) {
      const found = contacts.find((c) => c.id === contactId);
      if (found) {
        contact = found;
        sourceColumnId = colId;
        break;
      }
    }

    if (!contact) return;

    // Optimistic update
    const newContactsByColumn = { ...data.contactsByColumn };

    // Remove from source column
    newContactsByColumn[sourceColumnId] = (newContactsByColumn[sourceColumnId] || []).filter(
      (c) => c.id !== contactId
    );

    // Add to target column
    const destColumnId = columnId || 'null';
    if (!newContactsByColumn[destColumnId]) {
      newContactsByColumn[destColumnId] = [];
    }
    const updatedContact = { ...contact, kanbanColumnId: columnId };
    newContactsByColumn[destColumnId] = [updatedContact, ...newContactsByColumn[destColumnId]];

    // Update state immediately
    setData({
      ...data,
      contactsByColumn: newContactsByColumn,
    });

    // Make API call
    try {
      await api.patch(`/api/kanban/contacts/${contactId}/move`, { columnId });
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error('Erro ao mover contato', {
        description: axiosError.response?.data?.message || 'Tente novamente',
      });
      loadData(); // Reload to revert
    }
  };

  // Open card actions menu
  const handleOpenCardActions = (contact: Contact, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedContact(contact);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setCardActionsOpen(true);
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Pipeline</h1>
        <p className="text-gray-600">
          Gerencie seus contatos atraves do funil de vendas
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar contatos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
            />
          </div>

          {/* Filters */}
          <button
            onClick={() => setFilterPanelOpen(true)}
            className={`
              flex items-center gap-2 px-4 py-2.5 border-2 font-semibold text-sm transition
              ${activeFiltersCount > 0 ? 'border-[#00ff88] bg-[#00ff88]/10' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-[#00ff88] text-black rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 border-2 border-gray-300 hover:border-gray-400 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Add Column */}
        <button
          onClick={() => {
            setEditingColumn(null);
            setColumnModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition border-2 border-black"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Nova Coluna
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : data.columns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-gray-200 p-16 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
            <Columns3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black mb-2">
            Nenhuma coluna criada
          </h3>
          <p className="text-gray-600 mb-6 text-sm max-w-md mx-auto">
            Configure seu pipeline de vendas criando colunas para organizar seus contatos
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={setupDefaultColumns}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition border-2 border-black"
            >
              <Columns3 className="w-4 h-4" strokeWidth={2.5} />
              Usar Colunas Padrao
            </button>
            <button
              onClick={() => {
                setEditingColumn(null);
                setColumnModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 border-2 border-black font-bold hover:bg-gray-50 transition"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Criar do Zero
            </button>
          </div>
        </motion.div>
      ) : (
        <KanbanBoard
          data={data}
          onDataChange={setData}
          onEditColumn={(column) => {
            setEditingColumn(column);
            setColumnModalOpen(true);
          }}
          onDeleteColumn={(column) => setDeleteConfirmColumn(column)}
          onOpenCardActions={handleOpenCardActions}
        />
      )}

      {/* Stats */}
      {!loading && data.columns.length > 0 && (
        <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
          <span>
            <strong className="text-black">{data.totalContacts}</strong> contatos
          </span>
          <span>
            <strong className="text-black">{data.columns.length}</strong> colunas
          </span>
        </div>
      )}

      {/* Column Modal */}
      <ColumnModal
        isOpen={columnModalOpen}
        onClose={() => {
          setColumnModalOpen(false);
          setEditingColumn(null);
        }}
        onSave={editingColumn ? handleUpdateColumn : handleCreateColumn}
        column={editingColumn}
      />

      {/* Filter Panel */}
      <FilterPanel
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

      {/* Card Actions Menu */}
      <CardActionsMenu
        isOpen={cardActionsOpen}
        onClose={() => setCardActionsOpen(false)}
        contact={selectedContact}
        position={menuPosition}
        columns={data.columns}
        onMoveToColumn={handleMoveContact}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmColumn && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setDeleteConfirmColumn(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-black p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black mb-1">
                    Deletar Coluna
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tem certeza que deseja deletar a coluna{' '}
                    <strong>{deleteConfirmColumn.name}</strong>?
                    {deleteConfirmColumn.contactsCount > 0 && (
                      <>
                        {' '}
                        Os {deleteConfirmColumn.contactsCount} contatos nela serao
                        movidos para &quot;Sem Coluna&quot;.
                      </>
                    )}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirmColumn(null)}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 font-bold text-sm hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeleteColumn(deleteConfirmColumn)}
                      className="flex-1 px-4 py-2 bg-red-600 border-2 border-red-600 text-white font-bold text-sm hover:bg-red-700 transition"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
