'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import { ProfileTab } from './components/ProfileTab';
import { BillingTab } from './components/BillingTab';
import { NotificationsTab } from './components/NotificationsTab';
import { PrivacyTab } from './components/PrivacyTab';

type TabId = 'perfil' | 'cobranca' | 'notificacoes' | 'privacidade';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof User;
}

const tabs: Tab[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'cobranca', label: 'Cobrança', icon: CreditCard },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'privacidade', label: 'Privacidade', icon: Shield },
];

export default function ConfiguracoesPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'perfil';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('settings_active_tab', activeTab);
  }, [activeTab]);

  // Restore active tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('settings_active_tab') as TabId;
    if (savedTab && tabs.some((t) => t.id === savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return <ProfileTab />;
      case 'cobranca':
        return <BillingTab />;
      case 'notificacoes':
        return <NotificationsTab />;
      case 'privacidade':
        return <PrivacyTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-black mb-2">
          Configurações
        </h1>
        <p className="text-gray-600 font-medium">
          Gerencie suas preferências e configurações de conta
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b-3 border-black mb-8">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-bold text-sm
                  border-2 border-black
                  transition-all relative top-[2px] z-10
                  whitespace-nowrap
                  hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
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
      <div className="space-y-6">{renderTabContent()}</div>
    </div>
  );
}
