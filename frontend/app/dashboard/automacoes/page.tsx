'use client';

import { useState, useEffect } from 'react';
import { Zap, Cake } from 'lucide-react';
import { FlowsTab } from './components/FlowsTab';
import { BirthdayTab } from './components/BirthdayTab';

type TabId = 'flows' | 'aniversarios';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Zap;
}

const tabs: Tab[] = [
  { id: 'flows', label: 'Flows', icon: Zap },
  { id: 'aniversarios', label: 'Aniversários', icon: Cake },
];

export default function AutomacoesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('flows');

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('automacoes_active_tab', activeTab);
  }, [activeTab]);

  // Restore active tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('automacoes_active_tab') as TabId;
    if (savedTab && tabs.some((t) => t.id === savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'flows':
        return <FlowsTab />;
      case 'aniversarios':
        return <BirthdayTab />;
      default:
        return <FlowsTab />;
    }
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-1">
          Automações
        </h1>
        <p className="text-gray-600 text-sm">
          Crie fluxos automatizados para engajar seus clientes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b-2 border-black mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 font-bold text-sm
                  border-2 border-black border-b-0
                  transition-all relative top-[2px]
                  ${
                    isActive
                      ? 'bg-[#00ff88] text-black'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" strokeWidth={2.5} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
}
