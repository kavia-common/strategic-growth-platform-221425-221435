const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Prefer SERVICE_ROLE_KEY for backend, fallback to generic KEY if that's what's provided.
// This key should have admin privileges for backend operations.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const maskKey = (key) => key ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : 'MISSING';

console.log('--- Supabase Configuration Check ---');
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Key: ${maskKey(supabaseServiceKey)}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('CRITICAL: Supabase credentials missing. Database features will fail.');
} else {
  console.log('Supabase client initializing with provided credentials.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
