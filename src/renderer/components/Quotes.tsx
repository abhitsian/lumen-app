import React, { useState, useEffect } from 'react';
import { Quote as QuoteIcon, Plus, Shuffle, Star, Edit3, Trash2, X, Check, Sparkles, BookOpen, Heart } from 'lucide-react';
import { db } from '../../shared/db/schema';
import { Quote } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Form state
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteAuthor, setNewQuoteAuthor] = useState('');
  const [newQuoteSource, setNewQuoteSource] = useState('');
  const [newQuoteTags, setNewQuoteTags] = useState('');

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    if (currentQuote) {
      setFadeIn(false);
      const timer = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [currentQuote]);

  const loadQuotes = async () => {
    try {
      const allQuotes = await db.quotes.toArray();
      setQuotes(allQuotes);
      if (allQuotes.length > 0 && !currentQuote) {
        setCurrentQuote(allQuotes[Math.floor(Math.random() * allQuotes.length)]);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const getRandomQuote = () => {
    if (quotes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentQuote(quotes[randomIndex]);
  };

  const addQuote = async () => {
    if (!newQuoteText.trim()) return;

    const quote: Quote = {
      id: uuidv4(),
      text: newQuoteText.trim(),
      author: newQuoteAuthor.trim() || undefined,
      source: newQuoteSource.trim() || undefined,
      tags: newQuoteTags.trim() ? newQuoteTags.split(',').map(t => t.trim()) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false,
    };

    try {
      await db.quotes.add(quote);
      setQuotes([...quotes, quote]);
      setCurrentQuote(quote);
      setNewQuoteText('');
      setNewQuoteAuthor('');
      setNewQuoteSource('');
      setNewQuoteTags('');
      setIsAddingQuote(false);
    } catch (error) {
      console.error('Error adding quote:', error);
    }
  };

  const toggleFavorite = async (quoteId: string) => {
    try {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) return;

      await db.quotes.update(quoteId, { isFavorite: !quote.isFavorite });
      setQuotes(quotes.map(q => q.id === quoteId ? { ...q, isFavorite: !q.isFavorite } : q));
      if (currentQuote?.id === quoteId) {
        setCurrentQuote({ ...currentQuote, isFavorite: !currentQuote.isFavorite });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteQuote = async (quoteId: string) => {
    try {
      await db.quotes.delete(quoteId);
      const updatedQuotes = quotes.filter(q => q.id !== quoteId);
      setQuotes(updatedQuotes);
      if (currentQuote?.id === quoteId) {
        setCurrentQuote(updatedQuotes.length > 0 ? updatedQuotes[0] : null);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (showAllQuotes) {
    return (
      <div className="h-full bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-light text-gray-800">Your Collection</h2>
            <button
              onClick={() => setShowAllQuotes(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Serene View
            </button>
          </div>

          <div className="grid gap-4">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg text-gray-700 leading-relaxed mb-3">"{quote.text}"</p>
                    {quote.author && (
                      <p className="text-sm text-gray-500">— {quote.author}</p>
                    )}
                    {quote.source && (
                      <p className="text-xs text-gray-400 mt-1">{quote.source}</p>
                    )}
                    {quote.tags && quote.tags.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {quote.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(quote.id)}
                      className={`p-2 rounded-full transition-colors ${
                        quote.isFavorite
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-gray-100 text-gray-400 hover:text-rose-400'
                      }`}
                    >
                      <Heart size={16} fill={quote.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => deleteQuote(quote.id)}
                      className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-amber-50/50 via-rose-50/50 to-purple-100/50 relative overflow-hidden">
      {/* Ambient background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center p-12">
        {/* Greeting */}
        <div className={`text-center mb-12 transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm font-light text-gray-500 tracking-widest uppercase mb-2">
            {getTimeBasedGreeting()}
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Sparkles size={16} />
            <p className="text-xs font-light">A moment of reflection</p>
            <Sparkles size={16} />
          </div>
        </div>

        {/* Quote display */}
        {currentQuote ? (
          <div className={`max-w-3xl transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center mb-8">
              <QuoteIcon size={32} className="mx-auto mb-8 text-purple-300/50" />
              <p className="text-3xl md:text-4xl font-light text-gray-700 leading-relaxed mb-8 px-8">
                {currentQuote.text}
              </p>
              {currentQuote.author && (
                <p className="text-lg text-gray-500 font-light">
                  — {currentQuote.author}
                </p>
              )}
              {currentQuote.source && (
                <p className="text-sm text-gray-400 mt-2 italic">
                  {currentQuote.source}
                </p>
              )}
            </div>

            {/* Tags */}
            {currentQuote.tags && currentQuote.tags.length > 0 && (
              <div className="flex justify-center gap-2 mb-8">
                {currentQuote.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/40 backdrop-blur-sm text-purple-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Favorite button */}
            <div className="flex justify-center mb-12">
              <button
                onClick={() => toggleFavorite(currentQuote.id)}
                className={`p-3 rounded-full transition-all ${
                  currentQuote.isFavorite
                    ? 'bg-rose-400/20 text-rose-600 scale-110'
                    : 'bg-white/30 text-gray-400 hover:text-rose-400 hover:bg-white/50'
                }`}
              >
                <Heart size={20} fill={currentQuote.isFavorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center max-w-md">
            <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-500 mb-2">Your quote collection is empty</p>
            <p className="text-sm text-gray-400 mb-8">
              Add your first quote to begin your journey of reflection
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 mt-8">
          {quotes.length > 1 && (
            <button
              onClick={getRandomQuote}
              className="px-6 py-3 bg-white/40 backdrop-blur-sm hover:bg-white/60 text-gray-700 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
            >
              <Shuffle size={18} />
              <span className="text-sm font-light">Another Quote</span>
            </button>
          )}
          <button
            onClick={() => setIsAddingQuote(true)}
            className="px-6 py-3 bg-purple-400/30 hover:bg-purple-400/40 backdrop-blur-sm text-purple-700 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
          >
            <Plus size={18} />
            <span className="text-sm font-light">Add Quote</span>
          </button>
          {quotes.length > 0 && (
            <button
              onClick={() => setShowAllQuotes(true)}
              className="px-6 py-3 bg-white/40 backdrop-blur-sm hover:bg-white/60 text-gray-700 rounded-full flex items-center gap-2 transition-all hover:scale-105 shadow-sm"
            >
              <BookOpen size={18} />
              <span className="text-sm font-light">View All ({quotes.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Add quote modal */}
      {isAddingQuote && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-8 z-10">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-gray-800">Add a New Quote</h3>
              <button
                onClick={() => setIsAddingQuote(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Quote Text *</label>
                <textarea
                  value={newQuoteText}
                  onChange={(e) => setNewQuoteText(e.target.value)}
                  placeholder="Enter the quote that resonates with you..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50 resize-none"
                  rows={4}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Author</label>
                  <input
                    type="text"
                    value={newQuoteAuthor}
                    onChange={(e) => setNewQuoteAuthor(e.target.value)}
                    placeholder="Who said it?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Source</label>
                  <input
                    type="text"
                    value={newQuoteSource}
                    onChange={(e) => setNewQuoteSource(e.target.value)}
                    placeholder="Book, article, etc."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Tags</label>
                <input
                  type="text"
                  value={newQuoteTags}
                  onChange={(e) => setNewQuoteTags(e.target.value)}
                  placeholder="inspiration, wisdom, motivation (comma separated)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={addQuote}
                  disabled={!newQuoteText.trim()}
                  className="flex-1 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Check size={18} />
                  <span>Add Quote</span>
                </button>
                <button
                  onClick={() => setIsAddingQuote(false)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
