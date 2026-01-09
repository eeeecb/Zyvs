import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SettingsCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  icon: Icon,
  children,
  className = '',
}: SettingsCardProps) {
  return (
    <div
      className={`bg-white border-2 border-black p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${className}`}
    >
      <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5" strokeWidth={2.5} />}
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
