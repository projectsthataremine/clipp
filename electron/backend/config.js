/**
 * Configuration fetching utilities
 * Fetches app configuration from Supabase config table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jijhacdgtccfftlangjq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppamhhY2RndGNjZmZ0bGFuZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjE3NTQsImV4cCI6MjA3NzU5Nzc1NH0.tA9O6xtlU0djnQ6t2G82z-2ANjnnmga9aeizcW9ePUA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cache for config values
let configCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all app config from Supabase
 * @returns {Promise<Object>} Config object with pricing, trial_days, app_name
 */
async function getConfig() {
  // Return cached config if still valid
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }

  try {
    const { data, error } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['pricing', 'trial_days', 'app_name']);

    if (error) {
      console.error('[Config] Error fetching config:', error);
      return getDefaultConfig();
    }

    if (!data || data.length === 0) {
      return getDefaultConfig();
    }

    // Convert array to object
    const config = {};
    data.forEach((item) => {
      config[item.key] = item.value;
    });

    configCache = {
      pricing: config.pricing || { monthly_price: 2, annual_price: 18 },
      trial_days: typeof config.trial_days === 'number' ? config.trial_days : 7,
      app_name: config.app_name || 'Clipp',
    };

    cacheTimestamp = Date.now();
    return configCache;
  } catch (error) {
    console.error('[Config] Error fetching config:', error);
    return getDefaultConfig();
  }
}

/**
 * Get default config values (fallback)
 * @returns {Object} Default config
 */
function getDefaultConfig() {
  return {
    pricing: {
      monthly_price: 2,
      annual_price: 18,
    },
    trial_days: 7,
    app_name: 'Clipp',
  };
}

/**
 * Get pricing configuration
 * @returns {Promise<Object>} Pricing object with monthly_price and annual_price
 */
async function getPricing() {
  const config = await getConfig();
  return config.pricing;
}

/**
 * Format price for display
 * @param {number} price - Price value
 * @returns {string} Formatted price (e.g., "$2")
 */
function formatPrice(price) {
  return `$${price}`;
}

/**
 * Calculate annual monthly equivalent
 * @param {Object} pricing - Pricing object
 * @returns {number} Monthly rate for annual plan
 */
function getAnnualMonthlyRate(pricing) {
  return Number((pricing.annual_price / 12).toFixed(2));
}

/**
 * Calculate annual savings
 * @param {Object} pricing - Pricing object
 * @returns {number} Savings amount
 */
function getAnnualSavings(pricing) {
  return pricing.monthly_price * 12 - pricing.annual_price;
}

module.exports = {
  getConfig,
  getPricing,
  formatPrice,
  getAnnualMonthlyRate,
  getAnnualSavings,
};
