'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Upload,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  Trash2,
  Edit,
  Loader2,
  Plus,
  FileDown,
  ChevronDown,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  customFields?: {
    company?: string;
    position?: string;
    city?: string;
    state?: string;
    [key: string]: any;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    city: '',
    state: '',
    notes: '',
  });

  useEffect(() => {
    loadContacts();
  }, [page, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadContacts() {
    try {
      setLoading(true);
      const response = await api.get('/api/contacts', {
        params: { page, limit: 20, search },
      });
      setContacts(response.data.contacts);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja deletar este contato?')) return;

    try {
      await api.delete(`/api/contacts/${id}`);
      loadContacts();
    } catch (error) {
      alert('Erro ao deletar contato');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name && !formData.email) {
      alert('Preencha pelo menos o nome ou email');
      return;
    }

    try {
      setSaving(true);
      await api.post('/api/contacts', formData);
      setModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        city: '',
        state: '',
        notes: '',
      });
      loadContacts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao salvar contato');
    } finally {
      setSaving(false);
    }
  }

  function downloadTemplate() {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/contacts/template`, '_blank');
  }

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-black">Contatos</h1>
              <p className="text-sm text-gray-600 mt-1">
                {total} {total === 1 ? 'contato cadastrado' : 'contatos cadastrados'}
              </p>
            </div>

            {/* Dropdown Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition flex items-center gap-2 border border-black/10"
              >
                <Upload className="w-4 h-4" strokeWidth={2.5} />
                Importar Contatos
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg z-50"
                  >
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/dashboard/clientes/importar');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
                    >
                      <Upload className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      <div>
                        <p className="font-semibold text-sm text-black">Importar arquivo</p>
                        <p className="text-xs text-gray-500">CSV ou Excel</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setModalOpen(true);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100"
                    >
                      <Plus className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      <div>
                        <p className="font-semibold text-sm text-black">Adicionar manualmente</p>
                        <p className="text-xs text-gray-500">Um contato por vez</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        downloadTemplate();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3"
                    >
                      <FileDown className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      <div>
                        <p className="font-semibold text-sm text-black">Ver arquivo de exemplo</p>
                        <p className="text-xs text-gray-500">Download template CSV</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou empresa..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Nenhum contato encontrado</h3>
            <p className="text-gray-600 mb-6 text-sm">
              {search
                ? 'Tente buscar com outros termos'
                : 'Comece importando seus contatos'}
            </p>
            {!search && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Adicionar Contato
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Contacts List */}
            <div className="space-y-3 mb-6">
              {contacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 hover:border-[#00ff88] p-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Name */}
                      <h3 className="text-lg font-semibold text-black mb-2">
                        {contact.name || 'Sem nome'}
                      </h3>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.customFields?.company && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            <span className="truncate">{contact.customFields.company}</span>
                          </div>
                        )}
                        {(contact.customFields?.city || contact.customFields?.state) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
                            <span>
                              {contact.customFields.city}
                              {contact.customFields.city && contact.customFields.state && ' - '}
                              {contact.customFields.state}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="w-3.5 h-3.5 text-gray-400" strokeWidth={2} />
                          {contact.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 text-xs font-semibold border"
                              style={{ backgroundColor: tag.color + '20', borderColor: tag.color, color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/dashboard/clientes/${contact.id}`)}
                        className="p-2 hover:bg-gray-100 transition"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4 text-gray-600" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 hover:bg-red-50 transition"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 transition"
                >
                  Anterior
                </button>
                <div className="px-4 py-2 bg-[#00ff88] border border-black text-black font-bold text-sm">
                  {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 hover:border-[#00ff88] font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 transition"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal - Adicionar Contato */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-300 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Adicionar Contato</h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1 hover:bg-gray-100 transition"
                  >
                    <X className="w-5 h-5 text-gray-600" strokeWidth={2} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-black mb-1">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="Nome completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="email@exemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Empresa
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Cargo
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="Cargo na empresa"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="São Paulo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
                        placeholder="SP"
                        maxLength={2}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-black mb-1">
                        Observações
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm resize-none"
                        placeholder="Notas sobre o contato..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-black font-semibold text-sm transition"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition flex items-center justify-center gap-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        'Salvar Contato'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
