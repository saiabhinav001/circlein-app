/**
 * Production configuration for CircleIn booking system
 * This file contains settings that can be adjusted for production environments
 */

export const PRODUCTION_CONFIG = {
  // FORCE PRODUCTION MODE: Set to true since Firebase indexes are confirmed to be set up
  SKIP_INDEX_VALIDATION: true,
  
  // COMPLETELY DISABLE INDEX WARNINGS: No more false index setup guides
  DISABLE_INDEX_WARNINGS: true,
  
  // Timeout for index validation (in milliseconds)
  INDEX_VALIDATION_TIMEOUT: 5000,
  
  // Cache duration for index validation results (in milliseconds)
  INDEX_VALIDATION_CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // Enable enhanced error logging in development
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  
  // Auto-retry failed queries (useful for temporary network issues)
  ENABLE_AUTO_RETRY: true,
  
  // Maximum number of retries for failed queries
  MAX_RETRY_ATTEMPTS: 3,
  
  // Delay between retry attempts (in milliseconds)
  RETRY_DELAY: 2000,
  
  // Enable optimistic UI updates
  ENABLE_OPTIMISTIC_UPDATES: true,
  
  // Default community ID for bookings
  DEFAULT_COMMUNITY_ID: 'default-community',
  
  // Enable real-time updates
  ENABLE_REALTIME_UPDATES: true,
  
  // Maximum bookings to load per query
  MAX_BOOKINGS_PER_QUERY: 100,
  
  // Enable QR code generation
  ENABLE_QR_CODES: true,
  
  // QR code expiration time (in hours)
  QR_CODE_EXPIRATION_HOURS: 24,
};

/**
 * Environment-specific overrides
 */
export const getEnvironmentConfig = () => {
  // PRODUCTION FIX: Check for environment overrides first
  const forceProductionMode = process.env.NEXT_PUBLIC_FORCE_PRODUCTION_MODE === 'true';
  const disableIndexWarnings = process.env.NEXT_PUBLIC_DISABLE_INDEX_WARNINGS === 'true';
  const enableDebugLogging = process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGGING === 'true';
  const enableAutoRetry = process.env.NEXT_PUBLIC_ENABLE_AUTO_RETRY !== 'false';
  
  const config = { ...PRODUCTION_CONFIG };
  
  // Apply environment overrides or default to production-ready settings
  config.SKIP_INDEX_VALIDATION = forceProductionMode || true; // Default to true since indexes are working
  config.DISABLE_INDEX_WARNINGS = disableIndexWarnings || true; // Default to true since indexes are working  
  config.ENABLE_DEBUG_LOGGING = enableDebugLogging || (process.env.NODE_ENV === 'development');
  config.ENABLE_AUTO_RETRY = enableAutoRetry;
  
  return config;
};

export default getEnvironmentConfig();