import React, { useState } from 'react';
import { Edit3, Sparkles } from 'lucide-react';
import { Quotes } from './Quotes';

interface NotesProps {
  // Scribbles props
  scribbles: any[];
  selectedScribble: string | null;
  scribbleSearch: string;
  setScribbleSearch: (search: string) => void;
  setSelectedScribble: (id: string | null) => void;
  createScribble: () => void;
  updateScribble: (id: string, updates: any) => void;
  deleteScribble: (id: string) => void;
  toggleScribblePin: (id: string) => void;
}

export function Notes({
  scribbles,
  selectedScribble,
  scribbleSearch,
  setScribbleSearch,
  setSelectedScribble,
  createScribble,
  updateScribble,
  deleteScribble,
  toggleScribblePin
}: NotesProps) {
  const [subView, setSubView] = useState<'scribbles' | 'quotes'>('scribbles');

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1">
          <button
            onClick={() => setSubView('scribbles')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              subView === 'scribbles'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Scribbles
            </span>
          </button>
          <button
            onClick={() => setSubView('quotes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              subView === 'quotes'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Quotes
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {subView === 'scribbles' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Scribbles content will be embedded from App.tsx */}
          {/* We'll pass this as children or render inline */}
        </div>
      )}

      {subView === 'quotes' && (
        <Quotes />
      )}
    </div>
  );
}
