export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

export const DEFAULT_EXCLUDED_DOMAINS = [
  'mail.google.com',
  'accounts.google.com',
  'login.microsoftonline.com',
  'chrome.google.com',
  'chrome-extension://'
];

export const DEFAULT_EXCLUDED_PATTERNS = [
  '/admin/',
  '/login/',
  '/signin/',
  '/signup/',
  '/auth/',
  '/checkout/',
  '/cart/'
];

export const MIN_CONTENT_LENGTH = 500;
export const TRACKING_DELAY = 5000; // 5 seconds
export const CAPTURE_DELAY = 30000; // 30 seconds

export const WORDS_PER_MINUTE = 200;
export const MAX_CONTENT_LENGTH = 50000;
