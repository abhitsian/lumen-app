import React, { useState } from 'react';
import { BookOpen, Folder } from 'lucide-react';
import { ReadingQueue } from './ReadingQueue';
import { Collections } from './Collections';

interface ReadingProps {
  // Queue props
  pages: any[];
  onUpdatePage: (id: string, updates: any) => void;
  onOpenUrl: (url: string) => void;
  onDeletePage: (id: string) => void;
  categorizePage: (page: any) => string;

  // Collections props
  collections: any[];
  onCreateCollection: (collection: any) => void;
  onUpdateCollection: (id: string, updates: any) => void;
  onDeleteCollection: (id: string) => void;
  onMovePageToCollection: (pageId: string, collectionId: string | null) => void;
}

export function Reading({
  pages,
  onUpdatePage,
  onOpenUrl,
  onDeletePage,
  categorizePage,
  collections,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onMovePageToCollection
}: ReadingProps) {
  const [subView, setSubView] = useState<'queue' | 'collections'>('queue');

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Sub-navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1">
          <button
            onClick={() => setSubView('queue')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              subView === 'queue'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Reading Queue
            </span>
          </button>
          <button
            onClick={() => setSubView('collections')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              subView === 'collections'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Collections
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {subView === 'queue' && (
        <ReadingQueue
          pages={pages}
          onUpdatePage={onUpdatePage}
          onOpenUrl={onOpenUrl}
          onDeletePage={onDeletePage}
          categorizePage={categorizePage}
        />
      )}

      {subView === 'collections' && (
        <Collections
          collections={collections}
          pages={pages}
          onCreateCollection={onCreateCollection}
          onUpdateCollection={onUpdateCollection}
          onDeleteCollection={onDeleteCollection}
          onMovePageToCollection={onMovePageToCollection}
          categorizePage={categorizePage}
        />
      )}
    </div>
  );
}
