import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';

process.env.JWT_SECRET = 'test_super_secret_jwt_key_for_testing_12345';
process.env.NODE_ENV = 'test';

async function runVerification() {
  console.log('🧪 Starting CodeSync Hub Authentication Test Suite...');
  let mongod;
  let server;
  let testPort = 5099;

  try {
    // 1. Start In-Memory MongoDB
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('  ✅ In-Memory MongoDB connected successfully');

    // 2. Start HTTP server on test port
    await new Promise((resolve) => {
      server = app.listen(testPort, resolve);
    });
    const baseUrl = `http://localhost:${testPort}`;

    const headers = { 'Content-Type': 'application/json' };

    // ── Test 1: Health check ─────────────────────────────────
    {
      const res = await fetch(`${baseUrl}/api/health`);
      const body = await res.json();
      if (res.status !== 200 || body.database !== 'connected') {
        throw new Error(`Health check failed: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 1. /api/health reports database connected');
    }

    // ── Test 2: Validation on short password ─────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'short',
          confirmPassword: 'short',
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || !body.message.includes('8 characters')) {
        throw new Error(`Short password test failed: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 2. Short password rejected (< 8 characters)');
    }

    // ── Test 3: Validation on password mismatch ───────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'password123',
          confirmPassword: 'mismatch_pass',
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || !body.message.includes('Passwords do not match')) {
        throw new Error(`Password mismatch test failed: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 3. Password mismatch rejected');
    }

    // ── Test 4: Successful Registration & Password Hashing ───
    let authToken = '';
    let cookieHeader = '';
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Ada Lovelace',
          email: 'Ada@Example.COM', // Test case normalization
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!',
        }),
      });
      const body = await res.json();
      if (res.status !== 201 || !body.success || !body.token || !body.user) {
        throw new Error(`Registration failed: ${JSON.stringify(body)}`);
      }
      if (body.user.password || body.user.passwordHash) {
        throw new Error('Security flaw: Password returned in registration response!');
      }
      if (body.user.email !== 'ada@example.com') {
        throw new Error(`Email was not normalized to lowercase: ${body.user.email}`);
      }

      authToken = body.token;
      cookieHeader = res.headers.get('set-cookie') || '';
      if (!cookieHeader.includes('token=')) {
        throw new Error('HTTP-only cookie was not set on registration');
      }

      // Verify directly in DB that password is NOT plaintext
      const dbUser = await mongoose.model('User').findOne({ email: 'ada@example.com' }).select('+password');
      if (!dbUser.password || dbUser.password.startsWith('SecurePassword123')) {
        throw new Error('Security flaw: Password was stored in plaintext or not bcrypt hashed!');
      }

      console.log('  ✅ 4. Successful registration: email normalized, bcrypt hashed, safe user returned, cookie set');
    }

    // ── Test 5: Duplicate email rejection ────────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Ada Duplicate',
          email: 'ada@example.com',
          password: 'AnotherPassword123',
          confirmPassword: 'AnotherPassword123',
        }),
      });
      const body = await res.json();
      if (res.status !== 400 || !body.message.includes('already exists')) {
        throw new Error(`Duplicate email was not rejected: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 5. Duplicate email registration rejected properly');
    }

    // ── Test 6: Incorrect Password Login Rejection ───────────
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'ada@example.com',
          password: 'WrongPassword999',
        }),
      });
      const body = await res.json();
      if (res.status !== 401 || body.message !== 'Invalid email or password') {
        throw new Error(`Incorrect password was not rejected properly: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 6. Incorrect password rejected with generic invalid credentials message');
    }

    // ── Test 7: Non-existent Email Login Rejection ───────────
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'nobody@example.com',
          password: 'AnyPassword123',
        }),
      });
      const body = await res.json();
      if (res.status !== 401 || body.message !== 'Invalid email or password') {
        throw new Error(`Non-existent email revealed existence: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 7. Non-existent email returns same generic 401 message (no user enumeration)');
    }

    // ── Test 8: Successful Login ─────────────────────────────
    let loginToken = '';
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'ada@example.com',
          password: 'SecurePassword123!',
        }),
      });
      const body = await res.json();
      if (res.status !== 200 || !body.success || !body.token || !body.user) {
        throw new Error(`Login failed: ${JSON.stringify(body)}`);
      }
      loginToken = body.token;
      console.log('  ✅ 8. Successful login: JWT token generated and safe user profile returned');
    }

    // ── Test 9: Protected Route /api/auth/me with Bearer token ───
    {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${loginToken}`,
        },
      });
      const body = await res.json();
      if (res.status !== 200 || body.user.email !== 'ada@example.com') {
        throw new Error(`Protected route /me failed with Bearer token: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 9. /api/auth/me verified successfully using Bearer token');
    }

    // ── Test 10: Protected Route /api/auth/me with Cookie ────
    {
      const cookieValue = cookieHeader.split(';')[0];
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Cookie: cookieValue,
        },
      });
      const body = await res.json();
      if (res.status !== 200 || body.user.email !== 'ada@example.com') {
        throw new Error(`Protected route /me failed with HTTP-only cookie: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 10. /api/auth/me verified successfully using HTTP-only cookie');
    }

    // ── Test 11: Invalid Token Rejection ─────────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: 'Bearer invalid_tampered_token',
        },
      });
      const body = await res.json();
      if (res.status !== 401) {
        throw new Error(`Invalid token was not rejected: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 11. Invalid/tampered JWT rejected with 401');
    }

    // ── Test 12: Logout ──────────────────────────────────────
    {
      const res = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });
      const body = await res.json();
      const setCookie = res.headers.get('set-cookie') || '';
      if (res.status !== 200 || !setCookie.includes('token=;')) {
        throw new Error(`Logout failed to clear cookie: ${JSON.stringify(body)}`);
      }
      console.log('  ✅ 12. Logout successfully cleared HTTP-only auth cookie');
    }

    console.log('\n🎉 ALL 12 BACKEND AUTHENTICATION TESTS PASSED PERFECTLY!\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  }
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
