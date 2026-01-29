'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare,
  GitBranch,
  Columns3,
  Tag,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: Array<{ id: string; name: string; color: string }>;
}

interface TestStep {
  nodeId: string;
  type: string;
  label: string;
  status: string;
  result: Record<string, unknown>;
}

interface TestResult {
  flow: { id: string; name: string };
  contact: { id: string; name: string; email: string | null; phone: string | null };
  mode: string;
  steps: TestStep[];
  summary: { totalSteps: number; messagesCount: number };
}

interface TestFlowModalProps {
  flowId: string;
  flowName: string;
  onClose: () => void;
}

const stepIcons: Record<string, typeof Zap> = {
  trigger: Zap,
  delay: Clock,
  message: MessageSquare,
  condition: GitBranch,
  kanban: Columns3,
  tag: Tag,
};

export function TestFlowModal({ flowId, onClose }: TestFlowModalProps) {
  const [step, setStep] = useState<'select' | 'result'>('select');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [mode, setMode] = useState<'simulation' | 'real'>('simulation');
  const [result, setResult] = useState<TestResult | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/contacts', {
        params: { limit: 50, search },
      });
      setContacts(response.data.contacts);
    } catch {
      toast.error('Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  async function handleTest() {
    if (!selectedContact) {
      toast.warning('Selecione um contato');
      return;
    }

    try {
      setTesting(true);
      const response = await api.post(`/api/flows/${flowId}/test`, {
        contactId: selectedContact.id,
        mode,
      });
      setResult(response.data);
      setStep('result');
    } catch (error: unknown) {
      const message = error instanceof Error && 'response' in error
        ? ((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao testar flow')
        : 'Erro ao testar flow';
      toast.error(message);
    } finally {
      setTesting(false);
    }
  }

  function renderSelectStep() {
    return (
      <>
        <p className="text-gray-600 mb-4">
          Selecione um contato para simular a execução do flow:
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:outline-none focus:border-[#00ff88] text-sm"
          />
        </div>

        {/* Contact List */}
        <div className="border border-gray-200 max-h-60 overflow-y-auto mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhum contato encontrado
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3 text-left border-b border-gray-100 last:border-b-0 transition ${
                  selectedContact?.id === contact.id
                    ? 'bg-[#00ff88]/10'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedContact?.id === contact.id
                        ? 'border-[#00ff88] bg-[#00ff88]'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedContact?.id === contact.id && (
                      <CheckCircle2 className="w-3 h-3 text-black" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black truncate">
                      {contact.name || 'Sem nome'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {contact.email || contact.phone || 'Sem contato'}
                    </p>
                    {contact.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: tag.color + '20',
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Mode Selection */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <p className="text-sm font-semibold text-black mb-2">Modo de teste:</p>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="mode"
                checked={mode === 'simulation'}
                onChange={() => setMode('simulation')}
                className="accent-[#00ff88]"
              />
              <div>
                <p className="font-semibold text-black text-sm">Simulação</p>
                <p className="text-xs text-gray-500">
                  Apenas mostra o que aconteceria
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
              <input
                type="radio"
                name="mode"
                checked={mode === 'real'}
                onChange={() => setMode('real')}
                className="accent-[#00ff88]"
              />
              <div>
                <p className="font-semibold text-black text-sm">Execução real</p>
                <p className="text-xs text-gray-500">
                  Envia mensagens de verdade
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 font-semibold text-sm transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleTest}
            disabled={!selectedContact || testing}
            className="flex-1 px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testando...
              </>
            ) : (
              'Executar Teste'
            )}
          </button>
        </div>
      </>
    );
  }

  function renderResultStep() {
    if (!result) return null;

    return (
      <>
        {/* Success Message */}
        <div className="flex items-center gap-3 p-4 bg-[#00ff88]/10 border border-[#00ff88] mb-4">
          <CheckCircle2 className="w-6 h-6 text-[#00ff88]" />
          <div>
            <p className="font-bold text-black">
              {mode === 'simulation'
                ? 'Simulação concluída com sucesso!'
                : 'Teste executado com sucesso!'}
            </p>
            <p className="text-sm text-gray-600">
              Contato: {result.contact.name}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="border border-gray-200 max-h-80 overflow-y-auto mb-4">
          <p className="text-sm font-semibold text-black p-3 bg-gray-50 border-b border-gray-200">
            Passos executados:
          </p>
          <div className="divide-y divide-gray-100">
            {result.steps.map((step, index) => {
              const Icon = stepIcons[step.type] || Zap;

              return (
                <div key={step.nodeId} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-[#00ff88]/20 text-[#00ff88]">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 font-medium">
                          {index + 1}.
                        </span>
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-black text-sm">
                          {step.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {Object.entries(step.result).map(([key, value]) => (
                          <p key={key}>
                            <span className="text-gray-400">{key}:</span>{' '}
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-3 mb-4 text-sm">
          <p className="text-gray-600">
            <strong>Resumo:</strong> {result.summary.totalSteps} passos -{' '}
            {result.summary.messagesCount} mensagens
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep('select');
              setResult(null);
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 font-semibold text-sm transition"
          >
            Testar Outro
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[#00ff88] hover:bg-[#00dd77] text-black font-bold text-sm transition"
          >
            Fechar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white w-full max-w-lg border border-gray-300 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-black">
              {step === 'select' ? 'Testar Automação' : 'Resultado do Teste'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'select' ? renderSelectStep() : renderResultStep()}
          </div>
        </div>
      </motion.div>
    </>
  );
}
