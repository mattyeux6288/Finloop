import { createClient } from '@supabase/supabase-js';
import { config } from './env';

// Service role client — bypasses RLS, used for admin operations only
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
