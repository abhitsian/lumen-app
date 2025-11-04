import { UserPreferences } from '../types';

export function shouldExclude(url: string, privacySettings: UserPreferences['privacy']): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;

    // Check excluded domains
    for (const excludedDomain of privacySettings.excludedDomains) {
      if (excludedDomain.startsWith('*.')) {
        // Wildcard subdomain matching
        const baseDomain = excludedDomain.slice(2);
        if (domain.endsWith(baseDomain)) {
          return true;
        }
      } else if (domain === excludedDomain || domain.includes(excludedDomain)) {
        return true;
      }
    }

    // Check excluded patterns
    for (const pattern of privacySettings.excludedPatterns) {
      if (path.includes(pattern)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking exclusion:', error);
    return false;
  }
}
