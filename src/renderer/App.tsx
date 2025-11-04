import { useEffect, useState } from 'react';
import React from 'react';
import { BookOpen, Plus, Search, Filter, BarChart3, FileText, Download, Command, Pin, Star, Trash2, Edit3, Check, X, TrendingUp, Clock, Globe, Tag, Folder, Target, Zap, AlertCircle, Code, MessageSquare, Palette, Briefcase, Music, Tv, Activity, ShoppingCart, Users, Newspaper, Library, Sparkles, Heart, Brain, ListOrdered, ChevronDown, ChevronUp } from 'lucide-react';
import { Quotes } from './components/Quotes';
import { Emotions } from './components/Emotions';
import { Insights } from './components/Insights';
import { Collections } from './components/Collections';
import { ReadingQueue } from './components/ReadingQueue';

declare global {
  interface Window {
    electron: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
      };
      captureCurrentPage: () => Promise<{ url: string; title: string; browser: string } | null>;
      onCaptureUrl: (callback: (data: any) => void) => void;
      onAutoCaptureUrl: (callback: (data: any) => void) => void;
      openUrl: (url: string) => Promise<{ success: boolean }>;
      startAutoTracking: () => Promise<{ success: boolean }>;
      stopAutoTracking: () => Promise<{ success: boolean }>;
      getAutoTrackingStatus: () => Promise<{ enabled: boolean }>;
      startAppTracking: () => Promise<{ success: boolean }>;
      stopAppTracking: () => Promise<{ success: boolean }>;
      getAppTrackingStatus: () => Promise<{ enabled: boolean }>;
      onAppActivity: (callback: (data: any) => void) => () => void;
      calendar: {
        getEvents: (daysAhead?: number) => Promise<{ success: boolean; events?: any[]; error?: string }>;
        startWatch: () => Promise<{ success: boolean }>;
        stopWatch: () => Promise<{ success: boolean }>;
        onUpdated: (callback: (events: any[]) => void) => () => void;
      };
    };
  }
}

interface CapturedPage {
  id: string;
  url: string;
  title: string;
  browser: string;
  timestamp: string;
  domain: string;
  notes?: string;
  status?: 'to-read' | 'reading' | 'read' | 'reference';
  tags?: string[];
  collection?: string;
  isPinned?: boolean;
  readingTimeMs?: number;
  priority?: 'low' | 'medium' | 'high';
  addedToQueue?: boolean;
  queuedAt?: string;
}

interface Analytics {
  totalPages: number;
  topDomains: { domain: string; count: number; timeMs: number }[];
  dailyCount: { date: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

interface AppSettings {
  dailyGoal: number;
  focusMode: boolean;
  distractionDomains: string[];
}

type AppCategory = 'development' | 'communication' | 'design' | 'productivity' | 'entertainment' | 'reference' | 'other';
type ProductivityLevel = 'high' | 'medium' | 'low' | 'neutral';

interface AppActivity {
  id: string;
  appName: string;
  category: AppCategory;
  productivityLevel: ProductivityLevel;
  startTime: string;
  endTime: string;
  durationMs: number;
  linkedPageId?: string; // Link to browser page if relevant
}

interface Activity {
  id: string;
  type: 'page' | 'app';
  timestamp: string;
  title: string;
  subtitle?: string;
  durationMs?: number;
  category?: AppCategory;
  productivityLevel?: ProductivityLevel;
  icon: string;
  data: CapturedPage | AppActivity;
}

interface Scribble {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  linkedPageId?: string;
  folder?: string;
  isPinned?: boolean;
}

interface AutoTrackRule {
  type: 'pages-count' | 'app-time' | 'category-count';
  threshold: number;
  category?: string;
  appName?: string;
}

interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  trackingType: 'manual' | 'auto';
  autoRule?: AutoTrackRule;
  targetDays?: number[]; // 0-6 for days of week
}

interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  value?: number; // for tracking counts
  note?: string;
}

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

interface SavedFilter {
  id: string;
  name: string;
  filters: {
    status?: string;
    domain?: string;
    collection?: string;
    tags?: string[];
    category?: string;
    emotion?: string;
  };
  createdAt: string;
}

interface WeeklyInsight {
  weekStart: string;
  weekEnd: string;
  totalPages: number;
  totalTime: number;
  topCategories: { category: string; count: number; percentage: number }[];
  topEmotions: { emotion: string; count: number; percentage: number }[];
  productivityScore: number;
  streak: number;
  insights: string[];
  emotionContentCorrelations: {
    category: string;
    emotions: { emotion: string; percentage: number }[];
  }[];
}

export default function App() {
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoTracking, setAutoTracking] = useState(false);
  const [appActivities, setAppActivities] = useState<AppActivity[]>([]);
  const [appTracking, setAppTracking] = useState(false);

  // Scribbles state
  const [scribbles, setScribbles] = useState<Scribble[]>([]);
  const [selectedScribble, setSelectedScribble] = useState<string | null>(null);
  const [scribbleSearch, setScribbleSearch] = useState('');

  // Habits state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<HabitCompletion[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [showAddHabit, setShowAddHabit] = useState(false);

  // Collections and filters
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [emotions, setEmotions] = useState<any[]>([]);

  // New feature states
  const [view, setView] = useState<'timeline' | 'scribbles' | 'habits' | 'quotes' | 'emotions' | 'insights' | 'collections' | 'queue'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ dailyGoal: 10, focusMode: false, distractionDomains: ['facebook.com', 'twitter.com', 'reddit.com'] });
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);

  useEffect(() => {
    // Load saved pages and activities
    loadPages();
    loadAppActivities();
    loadScribbles();
    loadHabits();
    loadHabitCompletions();
    loadCollections();
    loadEmotions();

    // Check tracking statuses
    loadAutoTrackingStatus();
    loadAppTrackingStatus();

    // Listen for capture events from global hotkey
    let cleanupCaptureUrl;
    let cleanupAutoCaptureUrl;
    let cleanupAppActivity;

    if (window.electron) {
      cleanupCaptureUrl = window.electron.onCaptureUrl(async (data) => {
        await capturePage(data);
      });

      // Listen for auto-capture events
      cleanupAutoCaptureUrl = window.electron.onAutoCaptureUrl(async (data) => {
        console.log('Auto-captured:', data);
        await capturePage(data);
      });

      // Listen for app activity events
      cleanupAppActivity = window.electron.onAppActivity((activity: AppActivity) => {
        console.log('App activity:', activity);
        setAppActivities(prevActivities => {
          const updatedActivities = [activity, ...prevActivities];
          window.electron.store.set('app-activities', updatedActivities);
          return updatedActivities;
        });
      });
    }

    // Cleanup listeners on unmount
    return () => {
      if (cleanupCaptureUrl) cleanupCaptureUrl();
      if (cleanupAutoCaptureUrl) cleanupAutoCaptureUrl();
      if (cleanupAppActivity) cleanupAppActivity();
    };
  }, []);

  const loadPages = async () => {
    try {
      const savedPages = await window.electron.store.get('captured-pages');
      if (savedPages) {
        setPages(savedPages);
      }
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

  const loadAppActivities = async () => {
    try {
      const savedActivities = await window.electron.store.get('app-activities');
      if (savedActivities) {
        setAppActivities(savedActivities);
      }
    } catch (error) {
      console.error('Error loading app activities:', error);
    }
  };

  const loadScribbles = async () => {
    try {
      const savedScribbles = await window.electron.store.get('scribbles');
      if (savedScribbles) {
        setScribbles(savedScribbles);
      }
    } catch (error) {
      console.error('Error loading scribbles:', error);
    }
  };

  const loadHabits = async () => {
    try {
      const savedHabits = await window.electron.store.get('habits');
      if (savedHabits) {
        setHabits(savedHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const loadHabitCompletions = async () => {
    try {
      const savedCompletions = await window.electron.store.get('habit-completions');
      if (savedCompletions) {
        setHabitCompletions(savedCompletions);
      }
    } catch (error) {
      console.error('Error loading habit completions:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const savedCollections = await window.electron.store.get('collections');
      if (savedCollections) {
        setCollections(savedCollections);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const loadEmotions = async () => {
    try {
      const savedEmotions = await window.electron.store.get('emotions');
      if (savedEmotions) {
        setEmotions(savedEmotions);
      }
    } catch (error) {
      console.error('Error loading emotions:', error);
    }
  };

  // Auto-save habits when they change
  useEffect(() => {
    if (habits.length > 0) {
      window.electron.store.set('habits', habits);
    }
  }, [habits]);

  // Auto-save habit completions when they change
  useEffect(() => {
    if (habitCompletions.length > 0) {
      window.electron.store.set('habit-completions', habitCompletions);
    }
  }, [habitCompletions]);

  // Auto-save collections when they change
  useEffect(() => {
    if (collections.length >= 0) {
      window.electron.store.set('collections', collections);
      // Apply auto-collection rules whenever collections or pages change
      applyAutoCollectionRules();
    }
  }, [collections]);

  // Auto-save emotions when they change
  useEffect(() => {
    if (emotions.length >= 0) {
      window.electron.store.set('emotions', emotions);
    }
  }, [emotions]);

  const createScribble = () => {
    const newScribble: Scribble = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: 'Untitled',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false
    };

    setScribbles(prev => {
      const updated = [newScribble, ...prev];
      window.electron.store.set('scribbles', updated);
      return updated;
    });
    setSelectedScribble(newScribble.id);
  };

  const updateScribble = (id: string, updates: Partial<Scribble>) => {
    setScribbles(prev => {
      const updated = prev.map(s =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      );
      window.electron.store.set('scribbles', updated);
      return updated;
    });
  };

  const deleteScribble = (id: string) => {
    setScribbles(prev => {
      const updated = prev.filter(s => s.id !== id);
      window.electron.store.set('scribbles', updated);
      return updated;
    });
    if (selectedScribble === id) {
      setSelectedScribble(null);
    }
  };

  const toggleScribblePin = (id: string) => {
    const scribble = scribbles.find(s => s.id === id);
    if (scribble) {
      updateScribble(id, { isPinned: !scribble.isPinned });
    }
  };

  // Collection management
  const createCollection = (collection: Omit<Collection, 'id' | 'createdAt'>) => {
    const newCollection: Collection = {
      ...collection,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setCollections(prev => [...prev, newCollection]);
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    setCollections(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const movePageToCollection = (pageId: string, collectionId: string) => {
    updatePage(pageId, { collection: collectionId || undefined });
  };

  const applyAutoCollectionRules = () => {
    if (collections.length === 0) return;

    const updatedPages = pages.map(page => {
      // Find matching collection with auto-rule
      const matchingCollection = collections.find(col => {
        if (!col.autoRule) return false;

        switch (col.autoRule.type) {
          case 'domain':
            return page.domain.toLowerCase().includes(col.autoRule.value.toLowerCase());
          case 'category':
            const category = categorizePage(page.domain, page.url, page.title);
            return category.toLowerCase() === col.autoRule.value.toLowerCase();
          case 'keyword':
            return page.title.toLowerCase().includes(col.autoRule.value.toLowerCase()) ||
                   page.url.toLowerCase().includes(col.autoRule.value.toLowerCase());
          default:
            return false;
        }
      });

      if (matchingCollection && page.collection !== matchingCollection.id) {
        return { ...page, collection: matchingCollection.id };
      }

      return page;
    });

    // Check if any pages changed
    const hasChanges = updatedPages.some((page, index) => page.collection !== pages[index].collection);
    if (hasChanges) {
      setPages(updatedPages);
      window.electron.store.set('captured-pages', updatedPages);
    }
  };

  const loadAutoTrackingStatus = async () => {
    try {
      const status = await window.electron.getAutoTrackingStatus();
      setAutoTracking(status.enabled);
    } catch (error) {
      console.error('Error loading auto-tracking status:', error);
    }
  };

  const loadAppTrackingStatus = async () => {
    try {
      const status = await window.electron.getAppTrackingStatus();
      setAppTracking(status.enabled);
    } catch (error) {
      console.error('Error loading app tracking status:', error);
    }
  };

  const toggleAutoTracking = async () => {
    try {
      if (autoTracking) {
        await window.electron.stopAutoTracking();
        setAutoTracking(false);
      } else {
        await window.electron.startAutoTracking();
        setAutoTracking(true);
      }
    } catch (error) {
      console.error('Error toggling auto-tracking:', error);
      alert('Failed to toggle auto-tracking');
    }
  };

  const toggleAppTracking = async () => {
    try {
      if (appTracking) {
        await window.electron.stopAppTracking();
        setAppTracking(false);
      } else {
        await window.electron.startAppTracking();
        setAppTracking(true);
      }
    } catch (error) {
      console.error('Error toggling app tracking:', error);
      alert('Failed to toggle app tracking');
    }
  };

  // Categorize pages based on domain patterns
  const categorizePage = (domain: string, url: string, title: string): string => {
    const lowerDomain = (domain || '').toLowerCase();
    const lowerUrl = (url || '').toLowerCase();
    const lowerTitle = (title || '').toLowerCase();

    // Work/Development
    if (
      lowerDomain.includes('github') ||
      lowerDomain.includes('gitlab') ||
      lowerDomain.includes('stackoverflow') ||
      lowerDomain.includes('linear') ||
      lowerDomain.includes('jira') ||
      lowerDomain.includes('notion') ||
      lowerDomain.includes('slack') ||
      lowerDomain.includes('figma') ||
      lowerDomain.includes('vercel') ||
      lowerDomain.includes('netlify') ||
      lowerDomain.includes('heroku') ||
      lowerDomain.includes('aws.amazon') ||
      lowerDomain.includes('console.cloud.google') ||
      lowerDomain.includes('azure') ||
      lowerUrl.includes('/docs') ||
      lowerUrl.includes('/documentation') ||
      lowerUrl.includes('/api')
    ) {
      return 'Work';
    }

    // News
    if (
      lowerDomain.includes('news') ||
      lowerDomain.includes('cnn') ||
      lowerDomain.includes('bbc') ||
      lowerDomain.includes('nytimes') ||
      lowerDomain.includes('theguardian') ||
      lowerDomain.includes('reuters') ||
      lowerDomain.includes('bloomberg') ||
      lowerDomain.includes('wsj') ||
      lowerDomain.includes('techcrunch') ||
      lowerDomain.includes('theverge') ||
      lowerDomain.includes('arstechnica') ||
      lowerDomain.includes('wired')
    ) {
      return 'News';
    }

    // Entertainment
    if (
      lowerDomain.includes('youtube') ||
      lowerDomain.includes('netflix') ||
      lowerDomain.includes('spotify') ||
      lowerDomain.includes('twitch') ||
      lowerDomain.includes('hulu') ||
      lowerDomain.includes('disneyplus') ||
      lowerDomain.includes('primevideo') ||
      lowerDomain.includes('soundcloud') ||
      lowerDomain.includes('vimeo') ||
      lowerDomain.includes('tiktok') ||
      lowerUrl.includes('/watch') ||
      lowerUrl.includes('/video')
    ) {
      return 'Entertainment';
    }

    // Social Media
    if (
      lowerDomain.includes('twitter') ||
      lowerDomain.includes('x.com') ||
      lowerDomain.includes('facebook') ||
      lowerDomain.includes('instagram') ||
      lowerDomain.includes('linkedin') ||
      lowerDomain.includes('reddit') ||
      lowerDomain.includes('discord') ||
      lowerDomain.includes('telegram')
    ) {
      return 'Social';
    }

    // Product/Learning
    if (
      lowerDomain.includes('medium') ||
      lowerDomain.includes('substack') ||
      lowerDomain.includes('dev.to') ||
      lowerDomain.includes('hashnode') ||
      lowerDomain.includes('hackernoon') ||
      lowerDomain.includes('freecodecamp') ||
      lowerDomain.includes('coursera') ||
      lowerDomain.includes('udemy') ||
      lowerDomain.includes('edx') ||
      lowerDomain.includes('khanacademy') ||
      lowerDomain.includes('producthunt') ||
      lowerUrl.includes('/blog') ||
      lowerUrl.includes('/article') ||
      lowerUrl.includes('/tutorial') ||
      lowerUrl.includes('/guide')
    ) {
      return 'Learning';
    }

    // Shopping
    if (
      lowerDomain.includes('amazon') ||
      lowerDomain.includes('ebay') ||
      lowerDomain.includes('etsy') ||
      lowerDomain.includes('shop') ||
      lowerUrl.includes('/product') ||
      lowerUrl.includes('/cart')
    ) {
      return 'Shopping';
    }

    // Reference
    if (
      lowerDomain.includes('wikipedia') ||
      lowerDomain.includes('wikihow') ||
      lowerDomain.includes('dictionary') ||
      lowerDomain.includes('translate')
    ) {
      return 'Reference';
    }

    return 'Other';
  };

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  };

  const capturePage = async (browserData: any) => {
    try {
      // Validate the data before capturing
      if (!browserData.url ||
          browserData.url === 'missing value' ||
          browserData.url.includes('missing value') ||
          !browserData.title ||
          browserData.title === 'Start Page' ||
          browserData.title.includes('missing value')) {
        alert('Cannot capture this page. Please navigate to a real webpage first.');
        return;
      }

      const domain = extractDomain(browserData.url);

      const newPage: CapturedPage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url: browserData.url,
        title: browserData.title,
        browser: browserData.browser,
        timestamp: new Date().toISOString(),
        domain,
        status: 'to-read',
        isPinned: false
      };

      // Use functional state update to avoid stale closure
      setPages(prevPages => {
        const updatedPages = [newPage, ...prevPages];
        window.electron.store.set('captured-pages', updatedPages);
        return updatedPages;
      });
    } catch (error) {
      console.error('Error capturing page:', error);
    }
  };

  const handleCaptureClick = async () => {
    setLoading(true);
    try {
      const browserData = await window.electron.captureCurrentPage();
      console.log('Received browser data:', browserData);

      if (browserData && browserData.error) {
        alert(`Error: ${browserData.error}`);
      } else if (browserData && browserData.url) {
        await capturePage(browserData);
      } else {
        alert('No active browser window found');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error capturing page: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const updatedPages = pages.filter((_, i) => i !== index);
    setPages(updatedPages);
    await window.electron.store.set('captured-pages', updatedPages);
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await window.electron.openUrl(url);
    } catch (error) {
      console.error('Error opening URL:', error);
      alert('Failed to open URL');
    }
  };

  // Activity feed helper functions
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const getCategoryIcon = (category: AppCategory) => {
    const icons = {
      development: Code,
      communication: MessageSquare,
      design: Palette,
      productivity: Briefcase,
      entertainment: Music,
      reference: BookOpen,
      other: Activity
    };
    return icons[category] || Activity;
  };

  const getProductivityColor = (level: ProductivityLevel): string => {
    const colors = {
      high: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-blue-600 bg-blue-50 border-blue-200',
      low: 'text-orange-600 bg-orange-50 border-orange-200',
      neutral: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[level] || colors.neutral;
  };

  const combineActivities = (): Activity[] => {
    const pageActivities: Activity[] = pages.map(page => ({
      id: page.id,
      type: 'page' as const,
      timestamp: page.timestamp,
      title: page.title,
      subtitle: page.domain,
      durationMs: page.readingTimeMs,
      icon: 'globe',
      data: page
    }));

    const appActivityItems: Activity[] = appActivities.map(activity => ({
      id: activity.id,
      type: 'app' as const,
      timestamp: activity.startTime,
      title: activity.appName,
      subtitle: `${activity.category} • ${formatDuration(activity.durationMs)}`,
      durationMs: activity.durationMs,
      category: activity.category,
      productivityLevel: activity.productivityLevel,
      icon: 'app',
      data: activity
    }));

    // Combine and sort by timestamp (most recent first)
    const combined = [...pageActivities, ...appActivityItems];
    return combined.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const groupActivitiesByDate = (): Record<string, Activity[]> => {
    const activities = combineActivities();
    const grouped: Record<string, Activity[]> = {};

    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });

    return grouped;
  };

  // Utility functions
  const filteredPages = pages.filter(page => {
    // Search filter
    if (searchQuery && !page.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !page.url.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Domain filter
    if (selectedDomain && page.domain !== selectedDomain) {
      return false;
    }
    // Status filter
    if (selectedStatus && page.status !== selectedStatus) {
      return false;
    }
    // Collection filter
    if (selectedCollection && page.collection !== selectedCollection) {
      return false;
    }
    return true;
  });

  // Sort: pinned first, then by timestamp
  const sortedPages = [...filteredPages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Analytics
  const analytics: Analytics = {
    totalPages: pages.length,
    topDomains: Object.entries(
      pages.reduce((acc, page) => {
        acc[page.domain] = (acc[page.domain] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([domain, count]) => ({ domain, count, timeMs: 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    dailyCount: [],
    categoryBreakdown: Object.entries(
      pages.reduce((acc, page) => {
        const category = categorizePage(page.domain, page.url, page.title);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  };

  const uniqueDomains = Array.from(new Set(pages.map(p => p.domain)));
  const usedCollectionIds = Array.from(new Set(pages.filter(p => p.collection).map(p => p.collection!)));

  // Page management functions
  const updatePage = (id: string, updates: Partial<CapturedPage>) => {
    setPages(prevPages => {
      const updated = prevPages.map(p => p.id === id ? { ...p, ...updates } : p);
      window.electron.store.set('captured-pages', updated);
      return updated;
    });
  };

  const togglePin = (id: string) => {
    const page = pages.find(p => p.id === id);
    if (page) updatePage(id, { isPinned: !page.isPinned });
  };

  const updateStatus = (id: string, status: CapturedPage['status']) => {
    updatePage(id, { status });
  };

  const updateNotes = (id: string, notes: string) => {
    updatePage(id, { notes });
    setEditingNotes(null);
  };

  const addToCollection = (id: string, collection: string) => {
    updatePage(id, { collection });
  };

  // Export functions
  const exportToCSV = () => {
    const csv = [
      ['Title', 'URL', 'Domain', 'Browser', 'Timestamp', 'Status', 'Collection', 'Notes'].join(','),
      ...pages.map(p => [
        `"${p.title}"`,
        `"${p.url}"`,
        p.domain,
        p.browser,
        p.timestamp,
        p.status || '',
        p.collection || '',
        `"${p.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readtrack-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToMarkdown = () => {
    const md = [`# Lumen Export - ${new Date().toLocaleDateString()}`, ''];

    const byDomain = pages.reduce((acc, p) => {
      acc[p.domain] = acc[p.domain] || [];
      acc[p.domain].push(p);
      return acc;
    }, {} as Record<string, CapturedPage[]>);

    Object.entries(byDomain).forEach(([domain, domainPages]) => {
      md.push(`## ${domain} (${domainPages.length} pages)`);
      md.push('');
      domainPages.forEach(p => {
        md.push(`### [${p.title}](${p.url})`);
        md.push(`- **Status**: ${p.status || 'N/A'}`);
        md.push(`- **Date**: ${new Date(p.timestamp).toLocaleString()}`);
        if (p.notes) md.push(`- **Notes**: ${p.notes}`);
        md.push('');
      });
    });

    const blob = new Blob([md.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readtrack-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setEditingNotes(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const todayGoalProgress = pages.filter(p => {
    const today = new Date().toDateString();
    return new Date(p.timestamp).toDateString() === today;
  }).length;

  // Helper function to get category metadata
  const getCategoryMeta = (category: string) => {
    const meta = {
      'Work': { icon: Briefcase, barColor: '#2563eb', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      'News': { icon: Newspaper, barColor: '#dc2626', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      'Entertainment': { icon: Tv, barColor: '#9333ea', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
      'Social': { icon: Users, barColor: '#ec4899', bgColor: 'bg-pink-100', textColor: 'text-pink-600' },
      'Learning': { icon: BookOpen, barColor: '#16a34a', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      'Shopping': { icon: ShoppingCart, barColor: '#ea580c', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
      'Reference': { icon: Library, barColor: '#4f46e5', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
      'Other': { icon: Globe, barColor: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
    };
    return meta[category as keyof typeof meta] || meta['Other'];
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-xl shadow-lg">
              <div className="w-5 h-5 bg-gradient-to-br from-white to-yellow-100 rounded-full shadow-inner" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">Lumen</h1>
              <p className="text-xs text-gray-500">{analytics.totalPages} pages illuminated</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Daily Goal Progress */}
            <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{todayGoalProgress}/{settings.dailyGoal}</span>
            </div>

            {/* Web Auto-Tracking Toggle */}
            <button
              onClick={toggleAutoTracking}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                autoTracking
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <div className={`w-2 h-2 rounded-full ${autoTracking ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-medium">{autoTracking ? 'Web ON' : 'Web OFF'}</span>
            </button>

            {/* App Tracking Toggle */}
            <button
              onClick={toggleAppTracking}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                appTracking
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <div className={`w-2 h-2 rounded-full ${appTracking ? 'bg-purple-600 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-medium">{appTracking ? 'App ON' : 'App OFF'}</span>
            </button>

            {/* Capture Button */}
            <button
              onClick={handleCaptureClick}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Capture
            </button>

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setView(view === 'timeline' ? 'timeline' : 'timeline')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 hidden group-hover:block z-50">
                <button onClick={exportToCSV} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={exportToMarkdown} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Export Markdown
                </button>
              </div>
            </div>

            {/* Command Palette Trigger */}
            <button
              onClick={() => setShowCommandPalette(!showCommandPalette)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Command className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-4 flex items-center gap-1 border-t border-gray-200">
          <button
            onClick={() => setView('timeline')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'timeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </span>
          </button>
          <button
            onClick={() => setView('emotions')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'emotions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Emotions
            </span>
          </button>
          <button
            onClick={() => setView('habits')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'habits'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Habits
            </span>
          </button>
          <button
            onClick={() => setView('scribbles')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'scribbles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Scribbles
            </span>
          </button>
          <button
            onClick={() => setView('quotes')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'quotes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Quotes
            </span>
          </button>
          <button
            onClick={() => setView('queue')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'queue'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              Queue
            </span>
          </button>
          <button
            onClick={() => setView('collections')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'collections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              Collections
            </span>
          </button>
          <button
            onClick={() => setView('insights')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              view === 'insights'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Insights
            </span>
          </button>
        </div>
      </div>

      {view === 'timeline' && (
        <>
          {/* Search & Filters */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-600">Filters:</span>

              {/* Domain Filter */}
              <select
                value={selectedDomain || ''}
                onChange={(e) => setSelectedDomain(e.target.value || null)}
                className="px-3 py-1 text-xs border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Domains</option>
                {uniqueDomains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus || ''}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                className="px-3 py-1 text-xs border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="to-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="read">Read</option>
                <option value="reference">Reference</option>
              </select>

              {sortedPages.length !== pages.length && (
                <span className="text-xs text-gray-500">
                  Showing {sortedPages.length} of {pages.length}
                </span>
              )}
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-4xl mx-auto">
              {/* Collapsible Header */}
              <button
                onClick={() => setAnalyticsCollapsed(!analyticsCollapsed)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Analytics</h3>
                  <span className="text-xs text-gray-500">
                    {analytics.totalPages} pages • {uniqueDomains.length} domains
                  </span>
                </div>
                {analyticsCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Collapsible Content */}
              {!analyticsCollapsed && (
                <div className="px-4 pb-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-1">Total Pages</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.totalPages}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-600 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">Today</p>
                      <p className="text-2xl font-bold text-green-900">{todayGoalProgress}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-purple-600 mb-1">Domains</p>
                      <p className="text-2xl font-bold text-purple-900">{uniqueDomains.length}</p>
                    </div>
                    <Globe className="w-8 h-8 text-purple-600 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Category Breakdown - Compact */}
              {analytics.categoryBreakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">ACTIVITY BY CATEGORY</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {analytics.categoryBreakdown.slice(0, 8).map((item) => {
                      const categoryMeta = getCategoryMeta(item.category);
                      const Icon = categoryMeta.icon;
                      const percentage = ((item.count / analytics.totalPages) * 100).toFixed(0);

                      return (
                        <div key={item.category} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded ${categoryMeta.bgColor}`}>
                              <Icon className={`w-3 h-3 ${categoryMeta.textColor}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-900">{item.category}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-gray-900">{item.count}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Content - Strava-like Activity Feed with Daily Grouping */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {combineActivities().length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-sm">
                  <Activity className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No activities yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Start tracking to see your activity feed
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {Object.entries(groupActivitiesByDate()).map(([date, activities]) => (
                  <div key={date} className="space-y-3">
                    {/* Date Header - Strava Style */}
                    <div className="sticky top-0 bg-gray-50 py-2 z-10">
                      <h2 className="text-lg font-bold text-gray-800">{date}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</span>
                        <span>•</span>
                        <span>{Math.round(activities.reduce((sum, a) => sum + (a.durationMs || 0), 0) / 60000)}m total time</span>
                      </div>
                    </div>

                    {/* Activities for this date */}
                    {activities.map((activity) => {
                  if (activity.type === 'page') {
                    const page = activity.data as CapturedPage;
                    return (
                      <div
                        key={page.id}
                        className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                          page.isPinned ? 'border-2 border-orange-400' : 'border border-gray-100'
                        }`}
                      >
                        <div className="p-5">
                          {/* Header */}
                          <div className="flex items-start gap-4 mb-4">
                            {/* Globe Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                              page.isPinned ? 'bg-orange-500' : 'bg-blue-500'
                            }`}>
                              <Globe className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* Page Title */}
                              <h2 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                {page.title}
                              </h2>

                              {/* Domain + Date */}
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="font-medium">{page.domain}</span>
                                <span>•</span>
                                <span>{new Date(page.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(page.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                              </div>
                            </div>

                            {/* Pin Badge */}
                            {page.isPinned && (
                              <div className="flex-shrink-0">
                                <div className="px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                                  <span className="text-orange-600 text-xs font-semibold">📌 Pinned</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Notes Section */}
                          {page.notes && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="text-sm text-gray-700 leading-relaxed">{page.notes}</p>
                            </div>
                          )}

                          {/* Footer Actions */}
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => handleOpenUrl(page.url)}
                              className="px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              Open Article
                            </button>
                            <button
                              onClick={() => togglePin(page.id)}
                              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              {page.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              onClick={() => setEditingNotes(page.id)}
                              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              {page.notes ? 'Edit Note' : 'Add Note'}
                            </button>
                            <div className="flex-1"></div>
                            <select
                              value={page.status}
                              onChange={(e) => updateStatus(page.id, e.target.value as any)}
                              className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                            >
                              <option value="to-read">To Read</option>
                              <option value="reading">Reading</option>
                              <option value="read">Read</option>
                              <option value="reference">Reference</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // App Activity Card - EXACT Strava Style
                    const appActivity = activity.data as AppActivity;
                    const CategoryIcon = getCategoryIcon(appActivity.category);
                    const isHighProductivity = appActivity.productivityLevel === 'high';

                    return (
                      <div
                        key={appActivity.id}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="p-5">
                          {/* Header: Icon + Title + Time */}
                          <div className="flex items-start gap-4 mb-4">
                            {/* Circular App Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                              isHighProductivity ? 'bg-orange-500' : 'bg-gray-200'
                            }`}>
                              <CategoryIcon className={`w-6 h-6 ${isHighProductivity ? 'text-white' : 'text-gray-600'}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              {/* App Name - Large and Bold */}
                              <h2 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                {appActivity.appName}
                              </h2>

                              {/* Category + Date */}
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="capitalize font-medium">{appActivity.category}</span>
                                <span>•</span>
                                <span>{new Date(appActivity.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(appActivity.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                              </div>
                            </div>

                            {/* Productivity Achievement Badge */}
                            {isHighProductivity && (
                              <div className="flex-shrink-0">
                                <div className="px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                                  <span className="text-orange-600 text-xs font-semibold">🔥 Focused</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Stats Grid - Strava Style */}
                          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
                            {/* Duration Stat */}
                            <div>
                              <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Time</div>
                              <div className="text-2xl font-bold text-gray-900">{formatDuration(appActivity.durationMs)}</div>
                            </div>

                            {/* Productivity Level */}
                            <div>
                              <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Focus</div>
                              <div className="text-2xl font-bold text-gray-900 capitalize">{appActivity.productivityLevel}</div>
                            </div>

                            {/* Session Type */}
                            <div>
                              <div className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Type</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {appActivity.productivityLevel === 'high' ? '⚡' :
                                 appActivity.productivityLevel === 'medium' ? '📝' :
                                 appActivity.productivityLevel === 'low' ? '☕' : '📊'}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar - Strava Orange */}
                          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full ${
                                isHighProductivity ? 'bg-orange-500' : 'bg-gray-300'
                              }`}
                              style={{ width: `${Math.min((appActivity.durationMs / (3600000)) * 100, 100)}%` }}
                            />
                          </div>

                          {/* Footer: Time Range */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{new Date(appActivity.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(appActivity.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            <span className="capitalize">{appActivity.category} session</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ))}
          </div>
          )}
        </div>
        </>
      )}

      {view === 'scribbles' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Scribbles List (Apple Notes style) */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Header with New Button */}
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={createScribble}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Scribble
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={scribbleSearch}
                  onChange={(e) => setScribbleSearch(e.target.value)}
                  placeholder="Search scribbles..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Scribbles List */}
            <div className="flex-1 overflow-y-auto">
              {scribbles
                .filter(s =>
                  s.title.toLowerCase().includes(scribbleSearch.toLowerCase()) ||
                  s.content.toLowerCase().includes(scribbleSearch.toLowerCase())
                )
                .sort((a, b) => {
                  // Pinned first
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  // Then by updated time
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                })
                .map(scribble => (
                  <button
                    key={scribble.id}
                    onClick={() => setSelectedScribble(scribble.id)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedScribble === scribble.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                        {scribble.title}
                      </h3>
                      {scribble.isPinned && <Pin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(scribble.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {scribble.content || 'No content'}
                    </p>
                  </button>
                ))}

              {scribbles.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Edit3 className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">No scribbles yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first scribble to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Scribble Editor (Apple Notes style) */}
          <div className="flex-1 flex flex-col bg-gradient-to-b from-[#fef9e7] to-[#fef5d4]">
            {selectedScribble && scribbles.find(s => s.id === selectedScribble) ? (
              <>
                {/* Editor Header with Actions */}
                <div className="p-4 border-b border-amber-200 bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date(scribbles.find(s => s.id === selectedScribble)!.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleScribblePin(selectedScribble)}
                        className={`p-2 rounded-lg transition-colors ${
                          scribbles.find(s => s.id === selectedScribble)?.isPinned
                            ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        title={scribbles.find(s => s.id === selectedScribble)?.isPinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this scribble?')) {
                            deleteScribble(selectedScribble);
                          }
                        }}
                        className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Title Input */}
                <div className="p-6 pb-0">
                  <input
                    type="text"
                    value={scribbles.find(s => s.id === selectedScribble)?.title || ''}
                    onChange={(e) => updateScribble(selectedScribble, { title: e.target.value })}
                    className="w-full text-3xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-400"
                    placeholder="Untitled"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                  />
                </div>

                {/* Content Textarea */}
                <div className="flex-1 p-6 pt-4 overflow-y-auto">
                  <textarea
                    value={scribbles.find(s => s.id === selectedScribble)?.content || ''}
                    onChange={(e) => updateScribble(selectedScribble, { content: e.target.value })}
                    className="w-full h-full text-base text-gray-800 bg-transparent border-none outline-none resize-none placeholder-gray-400 leading-relaxed"
                    placeholder="Start writing..."
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Edit3 className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Scribble Selected</h3>
                  <p className="text-sm text-gray-500">Select a scribble from the list or create a new one</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Habits View */}
      {view === 'habits' && (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
                <p className="text-sm text-gray-500 mt-1">Track your habits and build streaks</p>
              </div>
              <button
                onClick={() => setShowAddHabit(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                New Habit
              </button>
            </div>

            {/* Habits List */}
            {habits.length === 0 ? (
              <div className="text-center py-20">
                <Target className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Habits Yet</h3>
                <p className="text-gray-500 text-sm mb-4">Create your first habit to start tracking</p>
                <button
                  onClick={() => setShowAddHabit(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {habits.map((habit) => {
                  // Get completion data for this habit
                  const habitCompletionData = habitCompletions.filter(c => c.habitId === habit.id);

                  // Calculate streak
                  const today = new Date();
                  const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(today);
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                  }).reverse();

                  const completedDays = last7Days.filter(date =>
                    habitCompletionData.some(c => c.date === date && c.completed)
                  ).length;

                  return (
                    <div key={habit.id} className="bg-white rounded-lg p-6 border border-gray-200">
                      {/* Habit Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: habit.color }}
                          />
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{habit.name}</h3>
                            {habit.description && (
                              <p className="text-sm text-gray-500 mt-0.5">{habit.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {habit.trackingType === 'auto' ? 'Automatic tracking' : 'Manual tracking'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{completedDays}/7</p>
                          <p className="text-xs text-gray-500">days this week</p>
                        </div>
                      </div>

                      {/* GitHub-style contribution graph - Last 30 days */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-xs font-semibold text-gray-600">LAST 30 DAYS</h4>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 30 }, (_, i) => {
                            const d = new Date(today);
                            d.setDate(d.getDate() - (29 - i));
                            const dateStr = d.toISOString().split('T')[0];
                            const completion = habitCompletionData.find(c => c.date === dateStr);
                            const isCompleted = completion?.completed || false;

                            return (
                              <div
                                key={i}
                                className="flex-1 aspect-square rounded"
                                style={{
                                  backgroundColor: isCompleted ? habit.color : '#e5e7eb',
                                  opacity: isCompleted ? 1 : 0.3
                                }}
                                title={`${dateStr}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Today's status */}
                      <div className="flex items-center gap-2">
                        {habit.trackingType === 'manual' ? (
                          <button
                            onClick={() => {
                              const todayStr = new Date().toISOString().split('T')[0];
                              const existing = habitCompletions.find(
                                c => c.habitId === habit.id && c.date === todayStr
                              );

                              if (existing) {
                                // Toggle completion
                                setHabitCompletions(
                                  habitCompletions.map(c =>
                                    c.habitId === habit.id && c.date === todayStr
                                      ? { ...c, completed: !c.completed }
                                      : c
                                  )
                                );
                              } else {
                                // Add new completion
                                setHabitCompletions([
                                  ...habitCompletions,
                                  {
                                    habitId: habit.id,
                                    date: todayStr,
                                    completed: true
                                  }
                                ]);
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              habitCompletionData.some(c => c.date === new Date().toISOString().split('T')[0] && c.completed)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            {habitCompletionData.some(c => c.date === new Date().toISOString().split('T')[0] && c.completed)
                              ? 'Completed Today'
                              : 'Mark Complete'}
                          </button>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {habitCompletionData.some(c => c.date === new Date().toISOString().split('T')[0] && c.completed)
                              ? '✓ Automatically completed today'
                              : 'Not yet completed today'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {editingNotes && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingNotes(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Note</h3>
            <textarea
              defaultValue={pages.find(p => p.id === editingNotes)?.notes || ''}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Write your notes here..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  updateNotes(editingNotes, e.currentTarget.value);
                }
              }}
            />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={(e) => {
                  const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                  updateNotes(editingNotes, textarea.value);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setEditingNotes(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50"
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Command className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search pages... (Cmd+K)"
                  className="flex-1 outline-none text-lg"
                  autoFocus
                />
              </div>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              <div className="text-xs font-medium text-gray-500 px-3 py-2">Quick Actions</div>
              <button onClick={() => { exportToCSV(); setShowCommandPalette(false); }} className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg text-sm">
                Export to CSV
              </button>
              <button onClick={() => { exportToMarkdown(); setShowCommandPalette(false); }} className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg text-sm">
                Export to Markdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      {showAddHabit && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddHabit(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Habit</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newHabit: Habit = {
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  color: formData.get('color') as string,
                  trackingType: formData.get('trackingType') as 'manual' | 'auto',
                  createdAt: new Date().toISOString()
                };
                setHabits([...habits, newHabit]);
                setShowAddHabit(false);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Habit Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Read for 30 minutes"
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
                    placeholder="What does this habit involve?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                      <label key={color} className="cursor-pointer">
                        <input
                          type="radio"
                          name="color"
                          value={color}
                          defaultChecked={color === '#3b82f6'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="trackingType"
                        value="manual"
                        defaultChecked
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-sm">Manual</div>
                        <div className="text-xs text-gray-500">Mark as complete yourself each day</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="trackingType"
                        value="auto"
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-sm">Automatic</div>
                        <div className="text-xs text-gray-500">Track based on your app usage (coming soon)</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create Habit
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHabit(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emotions View */}
      {view === 'emotions' && (
        <Emotions />
      )}

      {/* Quotes View */}
      {view === 'quotes' && (
        <Quotes />
      )}

      {/* Insights View */}
      {view === 'insights' && (
        <Insights
          pages={pages}
          appActivities={appActivities}
          emotions={emotions}
          categorizePage={categorizePage}
        />
      )}

      {/* Collections View */}
      {view === 'collections' && (
        <Collections
          collections={collections}
          pages={pages}
          onCreateCollection={createCollection}
          onUpdateCollection={updateCollection}
          onDeleteCollection={deleteCollection}
          onMovePageToCollection={movePageToCollection}
          categorizePage={categorizePage}
        />
      )}

      {/* Reading Queue View */}
      {view === 'queue' && (
        <ReadingQueue
          pages={pages}
          onUpdatePage={updatePage}
          onOpenUrl={handleOpenUrl}
          onDeletePage={(id) => {
            const index = pages.findIndex(p => p.id === id);
            if (index >= 0) handleDelete(index);
          }}
          categorizePage={categorizePage}
        />
      )}
    </div>
  );
}
