import React from 'react';
import { Flame } from 'lucide-react';
import { ModuleShell } from '../components/ModuleShell';

export const HabitsPage: React.FC = () => {
  return (
    <ModuleShell
      title="Habits"
      description="Daily streaks, morning/evening rituals & atomic momentum tracker"
      icon={Flame}
      colorClass="text-orange-500 bg-orange-50 dark:bg-orange-950/40"
      category="Growth Module"
      highlights={[
        'Interactive streak grid inspired by GitHub activity',
        'Time-of-day habit clusters (Morning Routine, Deep Work, Wind Down)',
        'Habit stacking prompts and micro-commitment cues',
        'Completion percentages and monthly consistency scores',
      ]}
    />
  );
};
