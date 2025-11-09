import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PricingConfig {
  monthly_price: number;
  annual_price: number;
}

export interface AppConfig {
  pricing: PricingConfig;
  trial_days: number;
  app_name: string;
}

// Cache for config values
let configCache: AppConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getConfig(): Promise<AppConfig> {
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
      console.error('Error fetching config:', error);
      return getDefaultConfig();
    }

    if (!data || data.length === 0) {
      return getDefaultConfig();
    }

    // Convert array to object
    const config: any = {};
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
    console.error('Error fetching config:', error);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): AppConfig {
  return {
    pricing: {
      monthly_price: 2,
      annual_price: 18,
    },
    trial_days: 7,
    app_name: 'Clipp',
  };
}

export async function getPricing(): Promise<PricingConfig> {
  const config = await getConfig();
  return config.pricing;
}

// Helper to format price for display
export function formatPrice(price: number): string {
  return `$${price}`;
}

// Calculate annual monthly equivalent
export function getAnnualMonthlyRate(pricing: PricingConfig): number {
  return Number((pricing.annual_price / 12).toFixed(2));
}

// Calculate savings
export function getAnnualSavings(pricing: PricingConfig): number {
  return pricing.monthly_price * 12 - pricing.annual_price;
}
