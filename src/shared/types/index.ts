export type ContentType = 'article' | 'documentation' | 'video' | 'social' | 'other';

export interface ReadingSession {
  id: string;
  url: string;
  domain: string;
  title: string;
  author?: string;
  publishedDate?: string;

  // Engagement metrics
  startTime: Date;
  endTime: Date;
  activeReadingTime: number; // seconds
  scrollDepth: number; // 0-1

  // Content
  content: {
    text: string;
    wordCount: number;
    readingTimeEstimate: number; // minutes
    excerpt: string;
  };

  // Metadata
  contentType: ContentType;
  language: string;
  thumbnail?: string;

  // Categorization
  topics: string[];

  // User actions
  isArchived: boolean;
  isFavorite: boolean;
  userNotes: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyDigest {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'daily' | 'weekly' | 'monthly';

  summary: {
    totalArticles: number;
    totalReadingTime: number; // minutes
    topDomains: Array<{ domain: string; count: number }>;
    topics: Array<{
      name: string;
      articleCount: number;
      readingTime: number;
      keyInsights: string[];
    }>;
    aiSummary: string;
    notableArticles: string[]; // session IDs
  };

  generatedAt: Date;
  viewed: boolean;
  exported: boolean;
}

export interface UserPreferences {
  id?: string;
  privacy: {
    excludedDomains: string[];
    excludedPatterns: string[];
    minTimeThreshold: number; // seconds
    incognitoAutoExclude: boolean;
  };

  digest: {
    schedule: 'daily' | 'weekly' | 'off';
    deliveryTime: string; // HH:mm format
    deliveryMethod: 'popup' | 'notification';
    includeStats: boolean;
    topicClustering: boolean;
  };

  ai: {
    apiKey: string;
    model: string;
    summaryLength: 'short' | 'medium' | 'long';
  };

  storage: {
    retentionDays: number;
    autoArchiveAfter: number;
    maxStorageMB: number;
  };
}

export interface Topic {
  id: string;
  name: string;
  color: string;
  sessionCount: number;
  lastSeen: Date;
}

export interface EngagementMetrics {
  timeSpent: number;
  scrollDepth: number;
  interactionCount: number;
  lastInteraction: Date;
}

export interface Quote {
  id: string;
  text: string;
  author?: string;
  source?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite?: boolean;
  linkedPageId?: string; // Link to a reading session if quote came from there
}

// Re-export emotion types
export * from './emotions';
