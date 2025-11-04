import Dexie, { Table } from 'dexie';
import { ReadingSession, DailyDigest, UserPreferences, Topic, Quote, Reminder } from '../types';
import { DEFAULT_EXCLUDED_DOMAINS, DEFAULT_EXCLUDED_PATTERNS } from '../constants';

export class LumenDatabase extends Dexie {
  sessions!: Table<ReadingSession, string>;
  digests!: Table<DailyDigest, string>;
  preferences!: Table<UserPreferences, string>;
  topics!: Table<Topic, string>;
  quotes!: Table<Quote, string>;
  reminders!: Table<Reminder, string>;

  constructor() {
    super('LumenDB');

    this.version(1).stores({
      sessions: 'id, url, domain, startTime, contentType, isArchived, isFavorite, *topics',
      digests: 'id, date, type, generatedAt, viewed',
      preferences: 'id',
      topics: 'id, name, lastSeen'
    });

    // Add quotes table in version 2
    this.version(2).stores({
      sessions: 'id, url, domain, startTime, contentType, isArchived, isFavorite, *topics',
      digests: 'id, date, type, generatedAt, viewed',
      preferences: 'id',
      topics: 'id, name, lastSeen',
      quotes: 'id, createdAt, isFavorite, *tags, linkedPageId'
    });

    // Add reminders table in version 3
    this.version(3).stores({
      sessions: 'id, url, domain, startTime, contentType, isArchived, isFavorite, *topics',
      digests: 'id, date, type, generatedAt, viewed',
      preferences: 'id',
      topics: 'id, name, lastSeen',
      quotes: 'id, createdAt, isFavorite, *tags, linkedPageId',
      reminders: 'id, dueDate, isCompleted, isNotified, createdAt'
    });
  }
}

export const db = new LumenDatabase();

// Initialize default preferences
export async function initializeDefaults() {
  const existingPrefs = await db.preferences.get('default');

  if (!existingPrefs) {
    await db.preferences.add({
      id: 'default',
      privacy: {
        excludedDomains: DEFAULT_EXCLUDED_DOMAINS,
        excludedPatterns: DEFAULT_EXCLUDED_PATTERNS,
        minTimeThreshold: 30,
        incognitoAutoExclude: true
      },
      digest: {
        schedule: 'daily',
        deliveryTime: '08:00',
        deliveryMethod: 'popup',
        includeStats: true,
        topicClustering: true
      },
      ai: {
        apiKey: '',
        model: 'claude-sonnet-4-5-20250929',
        summaryLength: 'medium'
      },
      storage: {
        retentionDays: 90,
        autoArchiveAfter: 30,
        maxStorageMB: 500
      }
    } as UserPreferences);
  }
}
