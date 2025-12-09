const { createClient } = require('@supabase/supabase-js');

// Resolve Supabase URL: Prefer standard backend env, fallback to NEXT_PUBLIC_ (common in shared envs)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

// Resolve Supabase Key: Prefer Service Role Key, fallback to generic KEY, then NEXT_PUBLIC_ variants
// CRITICAL: Backend should ideally use SERVICE_ROLE_KEY for admin tasks.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.SUPABASE_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_KEY;

const maskKey = (key) => {
  if (!key) return 'MISSING';
  if (key.length < 10) return '***(too short)';
  return `${key.substring(0, 5)}...${key.substring(key.length - 5)}`;
};

console.log('--- Supabase Configuration Check ---');
console.log(`Supabase URL: ${supabaseUrl ? supabaseUrl : 'MISSING'}`);
console.log(`Supabase Key: ${maskKey(supabaseServiceKey)}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('CRITICAL: Supabase credentials missing. Database features will fail.');
} else {
  // Check if we might be using an Anon key instead of Service Role
  // Service role keys usually don't start with the same prefix as Anon, but length is similar.
  // We just log that we are initializing.
  console.log('Supabase client initializing with provided credentials.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase;
