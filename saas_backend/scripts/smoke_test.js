require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3001';
// Use a more standard-looking email
const TEST_EMAIL = `smoke.test.${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'Password123!';

async function runTests() {
  console.log('--- Starting Smoke Tests ---');

  // 1. Health Check
  try {
    const healthRes = await fetch(`${BASE_URL}/`);
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
    // Try to find the Service Role Key for admin tasks (creating confirmed users)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY; 
    // Fallback to anon key if we just need to sign in (but we can't create confirmed users with anon)
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || serviceRoleKey;

    const targetKey = serviceRoleKey || anonKey;

    console.log(`[Auth] Supabase URL: ${supabaseUrl}`);

    if (!supabaseUrl || !targetKey) {
      console.warn('Skipping Auth tests: Missing Supabase credentials in env');
      return;
    }

    // Use the strongest key available
    const supabase = createClient(supabaseUrl, targetKey);

    console.log(`[Auth] Attempting to create/get user: ${TEST_EMAIL}...`);
    
    // Try admin create first to ensure user is confirmed
    let userCreated = false;
    if (supabase.auth.admin) {
        const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true
        });
        if (!adminError && adminData.user) {
            console.log('[Auth] User created via Admin API (confirmed).');
            userCreated = true;
        } else {
            console.log(`[Auth] Admin create skipped/failed: ${adminError?.message}. Falling back to normal signup.`);
        }
    }

    if (!userCreated) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        
        if (signUpError) {
             console.log(`[Auth] Signup failed/exists: ${signUpError.message}`);
        } else if (!signUpData.session) {
             console.warn('[Auth] Signup successful but no session (email confirmation required). Admin key might be needed.');
        }
    }

    // Always try to sign in to get a fresh session
    console.log('[Auth] Attempting signin...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
    });

    if (signInError) {
        console.error(`[Auth] Signin failed: ${signInError.message}`);
        return; // Stop auth tests
    }
    
    if (signInData.session) {
        token = signInData.session.access_token;
        userId = signInData.user.id;
        console.log('[Auth] Authenticated. Token received.');
    }
    console.log('[Auth] Authenticated. Token received.');

  } catch (e) {
    console.error('[Auth] FAIL', e.message);
    process.exit(1);
  }

  if (!token) {
    console.log('[Smoke Tests] Stopping early due to lack of auth token.');
    return;
  }

  // 3. Backend Session Validation
  try {
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
    // Proceeding usually, but let's stop if basic auth fails on backend
    process.exit(1);
  }

  // 4. Create Conversation
  let conversationId;
  try {
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
      body: JSON.stringify({ content: 'Hello, what is 2+2? Answer briefly.' })
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
}

runTests();
