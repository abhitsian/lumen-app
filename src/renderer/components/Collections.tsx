import React, { useState } from 'react';
import { Plus, Folder, Edit3, Trash2, Settings, BookOpen, Sparkles, X } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: string;
  autoRule?: {
    type: 'domain' | 'category' | 'keyword';
    value: string;
  };
}

interface CapturedPage {
  id: string;
  url: string;
  title: string;
  domain: string;
  collection?: string;
  timestamp: string;
}

interface CollectionsProps {
  collections: Collection[];
  pages: CapturedPage[];
  onCreateCollection: (collection: Omit<Collection, 'id' | 'createdAt'>) => void;
  onUpdateCollection: (id: string, updates: Partial<Collection>) => void;
  onDeleteCollection: (id: string) => void;
  onMovePageToCollection: (pageId: string, collectionId: string) => void;
  categorizePage: (domain: string, url: string, title: string) => string;
}

export function Collections({
  collections,
  pages,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onMovePageToCollection,
  categorizePage
}: CollectionsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);

  const collectionColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'
  ];

  const getCollectionPages = (collectionId: string) => {
    return pages.filter(p => p.collection === collectionId);
  };

  const handleCreateCollection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const autoRuleType = formData.get('autoRuleType') as string;
    const autoRuleValue = formData.get('autoRuleValue') as string;

    onCreateCollection({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      color: formData.get('color') as string,
      autoRule: autoRuleType && autoRuleValue ? {
        type: autoRuleType as 'domain' | 'category' | 'keyword',
        value: autoRuleValue
      } : undefined
    });

    setShowAddModal(false);
  };

  const uncategorizedPages = pages.filter(p => !p.collection);

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* Sidebar - Collections List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* All Pages */}
          <button
            onClick={() => setSelectedCollection(null)}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              selectedCollection === null
                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">All Pages</div>
                <div className="text-xs text-gray-500">{pages.length} items</div>
              </div>
            </div>
          </button>

          {/* Uncategorized */}
          <button
            onClick={() => setSelectedCollection('uncategorized')}
            className={`w-full p-3 rounded-lg text-left transition-colors ${
              selectedCollection === 'uncategorized'
                ? 'bg-blue-50 border-l-4 border-l-blue-600'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Uncategorized</div>
                <div className="text-xs text-gray-500">{uncategorizedPages.length} items</div>
              </div>
            </div>
          </button>

          <div className="pt-4 pb-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
              My Collections
            </div>
          </div>

          {/* User Collections */}
          {collections.map(collection => {
            const pageCount = getCollectionPages(collection.id).length;
            return (
              <button
                key={collection.id}
                onClick={() => setSelectedCollection(collection.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors group ${
                  selectedCollection === collection.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: collection.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {collection.name}
                      {collection.autoRule && (
                        <Sparkles className="w-3 h-3 inline ml-1 text-purple-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{pageCount} items</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCollection(collection.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                  >
                    <Settings className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </button>
            );
          })}

          {collections.length === 0 && (
            <div className="text-center py-8 px-4">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No collections yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first collection</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Pages in Selected Collection */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedCollection === null && 'All Pages'}
              {selectedCollection === 'uncategorized' && 'Uncategorized Pages'}
              {selectedCollection && selectedCollection !== 'uncategorized' &&
                collections.find(c => c.id === selectedCollection)?.name
              }
            </h2>
            {selectedCollection && selectedCollection !== 'uncategorized' && (
              <p className="text-sm text-gray-500 mt-1">
                {collections.find(c => c.id === selectedCollection)?.description || 'No description'}
              </p>
            )}
          </div>

          {/* Pages List */}
          <div className="space-y-3">
            {(selectedCollection === null ? pages :
              selectedCollection === 'uncategorized' ? uncategorizedPages :
              getCollectionPages(selectedCollection)
            ).map(page => {
              const category = categorizePage(page.domain, page.url, page.title);
              return (
                <div
                  key={page.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{page.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{page.domain}</span>
                        <span>•</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{category}</span>
                        <span>•</span>
                        <span>{new Date(page.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <select
                      value={page.collection || ''}
                      onChange={(e) => onMovePageToCollection(page.id, e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No collection</option>
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}

            {(selectedCollection === null ? pages :
              selectedCollection === 'uncategorized' ? uncategorizedPages :
              getCollectionPages(selectedCollection)
            ).length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No pages here</h3>
                <p className="text-sm text-gray-500">
                  {selectedCollection === 'uncategorized'
                    ? 'All your pages are organized into collections!'
                    : 'Start capturing pages to see them here'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Collection Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Collection</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Product Management"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="What kind of content belongs here?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {collectionColors.map((color) => (
                      <label key={color} className="cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          defaultChecked={color === collectionColors[0]}
                          className="sr-only peer"
                        />
                        <div
                          className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-gray-900 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-gray-900 transition-all"
                          style={{ backgroundColor: color }}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <label className="text-sm font-medium text-gray-700">
                      Auto-Organize (optional)
                    </label>
                  </div>
                  <div className="space-y-2">
                    <select
                      name="autoRuleType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No auto-rule</option>
                      <option value="domain">By Domain</option>
                      <option value="category">By Category</option>
                      <option value="keyword">By Keyword</option>
                    </select>
                    <input
                      type="text"
                      name="autoRuleValue"
                      placeholder="e.g., github.com or Work or AI"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Pages matching this rule will automatically be added to this collection
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create Collection
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {editingCollection && collections.find(c => c.id === editingCollection) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingCollection(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Collection</h3>
            <div className="space-y-4">
              <button
                onClick={() => {
                  if (confirm('Delete this collection? Pages will not be deleted.')) {
                    onDeleteCollection(editingCollection);
                    setEditingCollection(null);
                    setSelectedCollection(null);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete Collection
              </button>
              <button
                onClick={() => setEditingCollection(null)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
