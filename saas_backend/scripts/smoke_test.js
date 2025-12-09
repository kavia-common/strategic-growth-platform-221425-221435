require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
// Use a fixed email to allow upsert/update logic, preventing user bloat
const TEST_EMAIL = process.env.SMOKE_TEST_EMAIL || 'smoke.test.automated@kavia.ai';
const TEST_PASSWORD = process.env.SMOKE_TEST_PASSWORD || 'Password123!';

const maskKey = (key) => {
  if (!key) return 'MISSING';
  if (key.length < 10) return '***(too short)';
  return `${key.substring(0, 5)}...${key.substring(key.length - 5)}`;
};

async function ensureConfirmedUser(supabaseAdmin, email, password) {
  console.log(`[Auth] Ensuring user ${email} exists and is confirmed...`);
  
  // 1. List users to find if exists
  // listUsers is paginated. For smoke tests on dev envs, 1000 should cover it.
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    console.log(`[Auth] User found (ID: ${existingUser.id}). Updating confirmation status...`);
    // 2. Update existing user
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: password,
      email_confirm: true,
      user_metadata: { smoke_test: true }
    });

    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }
    return data.user;
  } else {
    console.log('[Auth] User not found. Creating new confirmed user...');
    // 3. Create new user
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { smoke_test: true }
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }
    return data.user;
  }
}

async function runTests() {
  console.log('--- Starting Smoke Tests ---');

  // Node Version Check
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (majorVersion < 20) {
    console.warn(`[Warning] Running on Node ${nodeVersion}. Recommended: Node 20+ for best Supabase compatibility.`);
  } else {
    console.log(`[Env] Node version: ${nodeVersion} (OK)`);
  }

  // 1. Health Check
  try {
    const healthUrl = `${BASE_URL}/`;
    console.log(`[Health] Checking ${healthUrl}...`);
    const healthRes = await fetch(healthUrl);
    console.log(`[Health] Status: ${healthRes.status}`);
    if (healthRes.status !== 200) {
      throw new Error(`Health check failed: ${await healthRes.text()}`);
    }
    console.log('[Health] OK');
  } catch (e) {
    console.error('[Health] FAIL', e.message);
    process.exit(1);
  }

  // 2. Auth with Supabase
  let token;
  let userId;
  
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    console.log(`[Auth] Supabase URL: ${supabaseUrl ? supabaseUrl : 'MISSING'}`);
    console.log(`[Auth] Service Role Key: ${maskKey(serviceRoleKey)}`);
    console.log(`[Auth] Anon Key: ${maskKey(anonKey)}`);

    if (!supabaseUrl) {
      console.warn('[Auth] FAIL: Missing SUPABASE_URL');
      process.exit(1);
    }

    // Prepare clients
    // We need serviceRoleKey to force confirm users
    if (serviceRoleKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      await ensureConfirmedUser(supabaseAdmin, TEST_EMAIL, TEST_PASSWORD);
    } else {
      console.warn('[Auth] WARNING: SUPABASE_SERVICE_ROLE_KEY missing. Cannot ensure user is confirmed. Auth may fail if email confirmation is required.');
    }

    // Now sign in using the public/anon key context (simulating frontend)
    // If anon key is missing, fallback to service key for connection but this isn't ideal for "simulation"
    const publicKey = anonKey || serviceRoleKey;
    if (!publicKey) {
         throw new Error('No Supabase keys available for sign in.');
    }

    const supabasePublic = createClient(supabaseUrl, publicKey, {
        auth: {
            autoRefreshToken: false, // script is short lived
            persistSession: false
        }
    });

    console.log('[Auth] Attempting signInWithPassword...');
    const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signInError) {
      throw new Error(`Sign in failed: ${signInError.message}`);
    }

    if (!signInData.session) {
       throw new Error('Sign in succeeded but no session returned. User might not be confirmed?');
    }

    token = signInData.session.access_token;
    userId = signInData.user.id;
    console.log('[Auth] Authenticated. Token received.');

  } catch (e) {
    console.error('[Auth] FAIL', e.message);
    process.exit(1);
  }

  if (!token) {
     console.error('[Auth] FAIL: No token obtained.');
     process.exit(1);
  }

  // 3. Backend Session Validation
  try {
    console.log('[Backend Session] Validating session...');
    const sessionRes = await fetch(`${BASE_URL}/auth/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`[Backend Session] Status: ${sessionRes.status}`);
    if (sessionRes.status !== 200) {
       console.error('Body:', await sessionRes.text());
       throw new Error('Session validation failed');
    }
    console.log('[Backend Session] OK');
  } catch (e) {
    console.error('[Backend Session] FAIL', e.message);
    process.exit(1);
  }

  // 4. Create Conversation
  let conversationId;
  try {
    console.log('[Create Conversation] Creating test chat...');
    const convRes = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Smoke Test Chat' })
    });
    console.log(`[Create Conversation] Status: ${convRes.status}`);
    if (convRes.status !== 201) {
       console.error('Body:', await convRes.text());
       throw new Error('Create Conversation failed');
    }
    const convData = await convRes.json();
    conversationId = convData.id;
    console.log(`[Create Conversation] OK. ID: ${conversationId}`);
  } catch (e) {
    console.error('[Create Conversation] FAIL', e.message);
    process.exit(1);
  }

  // 5. Test Gemini Proxy (Send Message)
  try {
    console.log('[Gemini] Sending message...');
    const msgRes = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: 'Hello, check 1-2-3. Answer "OK".' })
    });
    console.log(`[Gemini] Status: ${msgRes.status}`);
    
    const msgData = await msgRes.json();
    if (msgRes.status !== 201) {
       console.error('[Gemini] Response:', JSON.stringify(msgData, null, 2));
       if (msgRes.status === 401 || msgRes.status === 403) {
         console.error('CHECK: API Key validity or Permissions.');
       }
       throw new Error('Gemini Proxy failed');
    }
    
    console.log('[Gemini] Response received.');
    console.log('User Message:', msgData.userMessage?.content);
    console.log('Assistant Message:', msgData.assistantMessage?.content);

    if (msgData.assistantMessage?.content) {
        console.log('[Gemini] OK');
    } else {
        console.warn('[Gemini] Warning: No content in assistant message');
    }

  } catch (e) {
    console.error('[Gemini] FAIL', e.message);
    process.exit(1);
  }

  console.log('--- Smoke Tests Completed Successfully ---');
  process.exit(0);
}

runTests();
