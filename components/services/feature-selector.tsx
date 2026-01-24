'use client';

import React from 'react';
import { Sparkles, Wind, Droplets, ShieldCheck, Trash2, Disc } from 'lucide-react';
import { FeatureCategory } from '@/lib/features/master-features';

// A mapping of icon strings to actual components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  droplets: Droplets,
  sparkles: Sparkles,
  'spray-can': Wind,
  disc: Disc,
  wind: Wind,
  trash: Trash2,
  'shield-check': ShieldCheck,
};

interface FeatureSelectorProps {
  featuresConfig: FeatureCategory[]; // The Master Options List (JSON)
  selectedIds: string[]; // Array of currently selected IDs e.g. ['ext_wash']
  onChange: (selectedIds: string[]) => void; // Function to update the parent state
}

export default function FeatureSelector({ 
  featuresConfig, 
  selectedIds, 
  onChange 
}: FeatureSelectorProps) {

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      // If already selected, remove it (filter it out)
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      // If not selected, add it
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {featuresConfig.map((category) => (
        <div key={category.category_id}>
          {/* Category Header */}
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {category.category_label}
          </h3>

          {/* Grid of Chips */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {category.options.map((option) => {
              const isSelected = selectedIds.includes(option.id);
              const IconComponent = ICON_MAP[option.icon] || Sparkles;

              return (
                <button
                  key={option.id}
                  type="button" // Important so it doesn't submit the form
                  onClick={() => handleToggle(option.id)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border text-left transition-all
                    ${isSelected 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600 dark:bg-blue-950/30 dark:border-blue-500 dark:text-blue-300' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-gray-800 dark:text-gray-300'
                    }
                  `}
                >
                  <IconComponent 
                    size={20} 
                    className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} 
                  />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
