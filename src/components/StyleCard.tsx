import React from 'react';
import {
  Link as LinkIcon,
  Shirt,
  Glasses,
  Watch,
  Scissors,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { StyleItem, StyleCategory, StyleStatus } from '../types/style';

interface StyleCardProps {
  item: StyleItem;
  onClick: (item: StyleItem) => void;
}

function isImageUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.toLowerCase();
  return (
    clean.includes('images.unsplash.com') ||
    clean.includes('unsplash.com/photos') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.png') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.gif') ||
    clean.includes('image')
  );
}

export const StyleCard: React.FC<StyleCardProps> = ({ item, onClick }) => {
  // Find first image link for thumbnail preview if available
  const imageLink = item.links.find((l) => isImageUrl(l.url));

  const getCategoryIcon = (category: StyleCategory) => {
    switch (category) {
      case 'clothes':
        return Shirt;
      case 'accessories':
        return Glasses;
      case 'watches':
        return Watch;
      case 'haircut':
        return Scissors;
    }
  };

  const Icon = getCategoryIcon(item.category);

  // Status visual dot & tooltip
  const getStatusDot = (status: StyleStatus) => {
    switch (status) {
      case 'bought':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Bought</span>
          </span>
        );
      case 'shortlisted':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Shortlisted</span>
          </span>
        );
      case 'idea':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-gray-300 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Idea</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onClick(item)}
      className="group bg-white dark:bg-[#1e293b] rounded-xl border border-[#e5e7eb] dark:border-[#334155] shadow-xs hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/50 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
    >
      {/* Optional image thumbnail */}
      {imageLink && (
        <div className="relative w-full h-36 bg-gray-100 dark:bg-slate-800 overflow-hidden">
          <img
            src={imageLink.url}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image container on broken URL
              (e.target as HTMLElement).parentElement!.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
          <div className="absolute top-2 right-2">
            {getStatusDot(item.status)}
          </div>
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Top Row: Brand & Status (if no image) */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] dark:text-[#94a3b8] truncate">
              {item.brand ? item.brand : item.category === 'haircut' ? 'Hair Inspiration' : 'Unbranded'}
            </span>
            {!imageLink && getStatusDot(item.status)}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-xs sm:text-sm text-[#111827] dark:text-[#f1f5f9] leading-snug line-clamp-2">
            {item.title}
          </h3>

          {/* Notes Snippet */}
          {item.notes && (
            <p className="text-[11px] text-[#6b7280] dark:text-[#94a3b8] line-clamp-2 mt-1 leading-relaxed">
              {item.notes}
            </p>
          )}
        </div>

        {/* Bottom Row: Link Counter & Category Indicator */}
        <div className="pt-2 border-t border-[#f3f4f6] dark:border-[#334155]/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1 text-[#6b7280] dark:text-[#94a3b8]">
            <LinkIcon className="w-3 h-3 text-violet-500" />
            <span className="font-medium">
              {item.links.length} {item.links.length === 1 ? 'link' : 'links'}
            </span>
          </div>

          <div className="text-[#9ca3af] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
