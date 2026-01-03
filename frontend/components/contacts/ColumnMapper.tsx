'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

interface ColumnMapperProps {
  headers: string[];
  previewData: Record<string, string>[];
  columnMapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

const CONTACT_FIELDS = [
  { value: 'name', label: 'Nome' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'company', label: 'Empresa' },
  { value: 'position', label: 'Cargo' },
  { value: 'city', label: 'Cidade' },
  { value: 'state', label: 'Estado' },
  { value: 'tags', label: 'Tags' },
  { value: 'notes', label: 'Observações' },
  { value: '_ignore', label: '❌ Ignorar coluna' },
];

export function ColumnMapper({
  headers,
  previewData,
  columnMapping,
  onMappingChange
}: ColumnMapperProps) {
  const [localMapping, setLocalMapping] = useState<Record<string, string>>(columnMapping);

  const handleMappingChange = (header: string, field: string) => {
    const newMapping = { ...localMapping, [header]: field };
    setLocalMapping(newMapping);
    onMappingChange(newMapping);
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-[#00ff88]/10 border-4 border-[#00ff88] rounded-xl p-4">
        <p className="font-bold">
          📋 Mapeie as colunas do seu arquivo para os campos do sistema
        </p>
        <p className="text-sm text-black/60 mt-1">
          Já identificamos automaticamente as colunas mais comuns. Revise e ajuste se necessário.
        </p>
      </div>

      {/* Column Mapping */}
      <div className="space-y-3">
        {headers.map((header, index) => (
          <motion.div
            key={header}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border-4 border-black rounded-xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center gap-4">
              {/* Original Header */}
              <div className="flex-1">
                <p className="text-xs text-black/60 mb-1">Coluna do arquivo:</p>
                <p className="font-black text-lg">{header}</p>
                {previewData[0] && (
                  <p className="text-sm text-black/60 mt-1 truncate">
                    Ex: {previewData[0][header] || '(vazio)'}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <ArrowRight className="w-6 h-6 text-black/40 flex-shrink-0" />

              {/* Field Selector */}
              <div className="flex-1">
                <p className="text-xs text-black/60 mb-1">Campo do sistema:</p>
                <select
                  value={localMapping[header] || '_ignore'}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="
                    w-full px-4 py-2
                    border-4 border-black rounded-lg
                    font-bold text-lg
                    bg-white
                    focus:outline-none focus:ring-4 focus:ring-[#00ff88]
                  "
                >
                  {CONTACT_FIELDS.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Icon */}
              {localMapping[header] && localMapping[header] !== '_ignore' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex-shrink-0"
                >
                  <div className="w-10 h-10 bg-[#00ff88] border-4 border-black rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-black" />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview Table */}
      <div className="border-4 border-black rounded-xl overflow-hidden">
        <div className="bg-black text-white px-4 py-3">
          <h4 className="font-black">📊 Preview dos dados (primeiras 5 linhas)</h4>
        </div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#ffeb3b] border-b-4 border-black">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-4 py-3 text-left font-black border-r-2 border-black last:border-r-0">
                    <div className="text-xs text-black/60">
                      {localMapping[header] && localMapping[header] !== '_ignore'
                        ? CONTACT_FIELDS.find(f => f.value === localMapping[header])?.label
                        : 'Ignorado'}
                    </div>
                    <div className="text-sm truncate">{header}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-b-2 border-black/10 last:border-b-0">
                  {headers.map(header => (
                    <td key={header} className="px-4 py-3 border-r-2 border-black/10 last:border-r-0">
                      <div className="text-sm truncate max-w-[200px]">
                        {row[header] || <span className="text-black/30">-</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mapping Summary */}
      <div className="bg-[#ffeb3b]/10 border-4 border-[#ffeb3b] rounded-xl p-4">
        <h4 className="font-black mb-2">📝 Resumo do mapeamento:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(localMapping).map(([header, field]) => {
            if (field === '_ignore') return null;
            const fieldLabel = CONTACT_FIELDS.find(f => f.value === field)?.label;
            return (
              <div key={header} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00ff88] rounded-full"></span>
                <span className="font-bold">{header}</span>
                <span className="text-black/40">→</span>
                <span>{fieldLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
