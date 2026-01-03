'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Building2,
  MapPin,
  User,
  Briefcase,
  StickyNote,
  Tag,
  X,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
  customFields?: {
    company?: string;
    position?: string;
    city?: string;
    state?: string;
  };
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

export default function ContactDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);

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

  const loadContact = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/contacts/${contactId}`);
      const data = response.data;
      setContact(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.customFields?.company || '',
        position: data.customFields?.position || '',
        city: data.customFields?.city || '',
        state: data.customFields?.state || '',
        notes: data.notes || '',
      });
    } catch {
      toast.error('Contato não encontrado');
      router.push('/dashboard/clientes');
    } finally {
      setLoading(false);
    }
  }, [contactId, router]);

  useEffect(() => {
    loadContact();
    loadTags();
  }, [loadContact]);

  async function loadTags() {
    try {
      const response = await api.get('/api/tags');
      setAllTags(response.data.tags || []);
    } catch {
      // Tags não carregadas, ok
    }
  }

  async function handleSave() {
    if (!formData.name && !formData.email) {
      toast.warning('Preencha pelo menos o nome ou email');
      return;
    }

    try {
      setSaving(true);
      await api.put(`/api/contacts/${contactId}`, formData);
      toast.success('Contato atualizado com sucesso');
      loadContact();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Erro ao salvar contato');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja deletar este contato?')) return;

    try {
      setDeleting(true);
      await api.delete(`/api/contacts/${contactId}`);
      toast.success('Contato deletado com sucesso');
      router.push('/dashboard/clientes');
    } catch {
      toast.error('Erro ao deletar contato');
      setDeleting(false);
    }
  }

  async function handleAddTag(tagId: string) {
    try {
      await api.post(`/api/contacts/${contactId}/tags`, { tagId });
      toast.success('Tag adicionada');
      loadContact();
      setShowTagSelector(false);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || 'Erro ao adicionar tag');
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      await api.delete(`/api/contacts/${contactId}/tags/${tagId}`);
      toast.success('Tag removida');
      loadContact();
    } catch {
      toast.error('Erro ao remover tag');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando contato...</p>
        </div>
      </div>
    );
  }

  if (!contact) return null;

  const availableTags = allTags.filter(
    (tag) => !contact.tags.some((t) => t.id === tag.id)
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/clientes')}
          className="flex items-center gap-2 mb-6 text-gray-600 hover:text-black transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Contatos
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">
              {contact.name || 'Sem nome'}
            </h1>
            <p className="text-gray-600 mt-1">
              Criado em {new Date(contact.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-white border border-red-300 hover:bg-red-50 text-red-600 font-semibold transition flex items-center gap-2"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Deletar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowTagSelector(!showTagSelector)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-sm font-semibold transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar Tag
            </button>

            {showTagSelector && availableTags.length > 0 && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {contact.tags.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma tag associada</p>
          ) : (
            contact.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 text-sm font-semibold border flex items-center gap-2"
                style={{
                  backgroundColor: tag.color + '20',
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 p-6"
      >
        <h2 className="text-lg font-bold text-black mb-6">Informações do Contato</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <User className="w-4 h-4 text-gray-500" />
              Nome
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="Nome completo"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <Mail className="w-4 h-4 text-gray-500" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Empresa
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="Nome da empresa"
            />
          </div>

          {/* Cargo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              Cargo
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="Cargo na empresa"
            />
          </div>

          {/* Cidade */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Cidade
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="São Paulo"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Estado
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
              placeholder="SP"
              maxLength={2}
            />
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-2">
              <StickyNote className="w-4 h-4 text-gray-500" />
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm resize-none"
              placeholder="Notas sobre o contato..."
              rows={4}
            />
          </div>
        </div>

        {/* Save Button (Mobile) */}
        <div className="mt-6 md:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-3 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </button>
        </div>
      </motion.div>
    </div>
  );
}
