import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from './ui';

interface ModuleShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  category: string;
  highlights?: string[];
}

export const ModuleShell: React.FC<ModuleShellProps> = ({
  title,
  description,
  icon: Icon,
  colorClass,
  category,
  highlights = [
    'Data model and Supabase tables scheduled',
    'Offline-ready mobile UI components planned',
    'Cross-module integration with ORBIT timeline',
  ],
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4 transition-colors duration-200">
      {/* Navigation Header */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7280] dark:text-[#94a3b8] hover:text-[#6366f1] dark:hover:text-[#818cf8] cursor-pointer transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-[11px] font-medium uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8]">
          {category}
        </span>
      </div>

      {/* Module Title Banner */}
      <div className="flex items-center gap-3.5 bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-[#e5e7eb] dark:border-[#334155] shadow-xs transition-colors duration-200">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] dark:text-[#f1f5f9] transition-colors duration-200">
              {title}
            </h1>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
          <p className="text-xs text-[#6b7280] dark:text-[#94a3b8] mt-0.5 leading-relaxed transition-colors duration-200">
            {description}
          </p>
        </div>
      </div>

      {/* Placeholder Body Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6366f1] dark:text-[#818cf8]" /> Module in Blueprint
          </CardTitle>
          <CardDescription>
            This module is part of the ORBIT Life OS architecture and ready for implementation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-4 border border-[#e5e7eb] dark:border-[#334155] transition-colors duration-200">
            <h4 className="text-xs font-semibold text-[#111827] dark:text-[#f1f5f9] mb-2 flex items-center gap-1.5 transition-colors duration-200">
              <Sparkles className="w-3.5 h-3.5 text-[#6366f1] dark:text-[#818cf8]" />
              Planned Features:
            </h4>
            <ul className="space-y-1.5">
              {highlights.map((item, idx) => (
                <li key={idx} className="text-xs text-[#6b7280] dark:text-[#94a3b8] flex items-start gap-2 transition-colors duration-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] dark:bg-[#818cf8] mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
