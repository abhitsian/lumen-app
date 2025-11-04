import React, { useState } from 'react';
import { ListOrdered, ArrowUp, ArrowDown, Minus, BookOpen, Clock, AlertCircle, CheckCircle, Globe, Trash2 } from 'lucide-react';

interface CapturedPage {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: string;
  status?: 'to-read' | 'reading' | 'read' | 'reference';
  priority?: 'low' | 'medium' | 'high';
  addedToQueue?: boolean;
  queuedAt?: string;
  readingTimeMs?: number;
}

interface ReadingQueueProps {
  pages: CapturedPage[];
  onUpdatePage: (id: string, updates: Partial<CapturedPage>) => void;
  onOpenUrl: (url: string) => void;
  onDeletePage: (id: string) => void;
  categorizePage: (domain: string, url: string, title: string) => string;
}

export function ReadingQueue({
  pages,
  onUpdatePage,
  onOpenUrl,
  onDeletePage,
  categorizePage
}: ReadingQueueProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const queuedPages = pages
    .filter(p => p.addedToQueue === true)
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then by queued time
      return new Date(a.queuedAt || a.timestamp).getTime() - new Date(b.queuedAt || b.timestamp).getTime();
    });

  const filteredPages = filter === 'all'
    ? queuedPages
    : queuedPages.filter(p => p.priority === filter);

  const stats = {
    total: queuedPages.length,
    high: queuedPages.filter(p => p.priority === 'high').length,
    medium: queuedPages.filter(p => p.priority === 'medium' || !p.priority).length,
    low: queuedPages.filter(p => p.priority === 'low').length,
    toRead: queuedPages.filter(p => p.status === 'to-read').length,
    reading: queuedPages.filter(p => p.status === 'reading').length
  };

  const addToQueue = (pageId: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    onUpdatePage(pageId, {
      addedToQueue: true,
      queuedAt: new Date().toISOString(),
      priority,
      status: 'to-read'
    });
  };

  const removeFromQueue = (pageId: string) => {
    onUpdatePage(pageId, {
      addedToQueue: false,
      queuedAt: undefined
    });
  };

  const changePriority = (pageId: string, priority: 'low' | 'medium' | 'high') => {
    onUpdatePage(pageId, { priority });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <ArrowUp className="w-3 h-3" />;
      case 'low':
        return <ArrowDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  // Suggest pages to add to queue
  const suggestedPages = pages
    .filter(p => !p.addedToQueue && p.status === 'to-read')
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <ListOrdered className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reading Queue</h1>
              <p className="text-sm text-gray-500">Prioritize and manage your reading list</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-1">TOTAL</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-100">
            <div className="text-xs font-medium text-red-600 mb-1">HIGH PRIORITY</div>
            <div className="text-2xl font-bold text-red-900">{stats.high}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="text-xs font-medium text-blue-600 mb-1">MEDIUM</div>
            <div className="text-2xl font-bold text-blue-900">{stats.medium}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-1">LOW</div>
            <div className="text-2xl font-bold text-gray-900">{stats.low}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-100">
            <div className="text-xs font-medium text-green-600 mb-1">READING</div>
            <div className="text-2xl font-bold text-green-900">{stats.reading}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'high'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            High Priority ({stats.high})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'medium'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Medium ({stats.medium})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'low'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Low Priority ({stats.low})
          </button>
        </div>

        {/* Queue List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Your Queue</h3>
            <p className="text-xs text-gray-500 mt-0.5">Sorted by priority, then by time added</p>
          </div>

          {filteredPages.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredPages.map((page, index) => {
                const category = categorizePage(page.domain, page.url, page.title);
                return (
                  <div
                    key={page.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Position Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                        {index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{page.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Globe className="w-3 h-3" />
                          <span>{page.domain}</span>
                          <span>•</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{category}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>Added {new Date(page.queuedAt || page.timestamp).toLocaleDateString()}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenUrl(page.url)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Read Now
                          </button>

                          {/* Priority Buttons */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => changePriority(page.id, 'high')}
                              className={`p-1.5 rounded transition-colors ${
                                page.priority === 'high'
                                  ? 'bg-red-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-200'
                              }`}
                              title="High Priority"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => changePriority(page.id, 'medium')}
                              className={`p-1.5 rounded transition-colors ${
                                page.priority === 'medium' || !page.priority
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-200'
                              }`}
                              title="Medium Priority"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => changePriority(page.id, 'low')}
                              className={`p-1.5 rounded transition-colors ${
                                page.priority === 'low'
                                  ? 'bg-gray-600 text-white'
                                  : 'text-gray-600 hover:bg-gray-200'
                              }`}
                              title="Low Priority"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <select
                            value={page.status || 'to-read'}
                            onChange={(e) => onUpdatePage(page.id, { status: e.target.value as any })}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="to-read">To Read</option>
                            <option value="reading">Reading</option>
                            <option value="read">Read</option>
                          </select>

                          <button
                            onClick={() => removeFromQueue(page.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Priority Badge */}
                      <div className={`flex-shrink-0 px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1 ${getPriorityColor(page.priority)}`}>
                        {getPriorityIcon(page.priority)}
                        <span className="capitalize">{page.priority || 'Medium'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ListOrdered className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {filter === 'all' ? 'Your queue is empty' : `No ${filter} priority items`}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'all'
                  ? 'Add pages from your timeline or suggestions below'
                  : 'Change the filter to see other items'
                }
              </p>
            </div>
          )}
        </div>

        {/* Suggested Pages to Add */}
        {suggestedPages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Suggested to Add</h3>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">Pages marked "To Read" that aren't in your queue yet</p>
            </div>

            <div className="divide-y divide-gray-100">
              {suggestedPages.map((page) => {
                const category = categorizePage(page.domain, page.url, page.title);
                return (
                  <div key={page.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{page.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{page.domain}</span>
                          <span>•</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToQueue(page.id, 'high')}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <ArrowUp className="w-3 h-3" />
                          High
                        </button>
                        <button
                          onClick={() => addToQueue(page.id, 'medium')}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                          <Minus className="w-3 h-3" />
                          Medium
                        </button>
                        <button
                          onClick={() => addToQueue(page.id, 'low')}
                          className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1"
                        >
                          <ArrowDown className="w-3 h-3" />
                          Low
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
