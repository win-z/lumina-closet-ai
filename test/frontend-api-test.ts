/**
 * ==================== Frontend API Test Suite ====================
 * 从前端视角测试所有 API 端点
 */

const API_BASE = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5178';

// Test results storage
const results: any[] = [];

async function test(name: string, fn: () => Promise<any>) {
  try {
    const result = await fn();
    results.push({ name, status: '✅ PASS', result });
    console.log(`✅ ${name}`);
    return result;
  } catch (error: any) {
    results.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
    throw error;
  }
}

// ==================== 1. Health Check ====================
async function testHealth() {
  return test('Health Check', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (!data.success) throw new Error('Health check failed');
    return data;
  });
}

// ==================== 2. Auth Flow ====================
async function testAuth() {
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'Test123456';
  const username = `TestUser${timestamp}`;

  // Register
  await test('User Registration', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { userId: data.data.user.id, token: data.data.token };
  });

  // Login
  const auth = await test('User Login', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { token: data.data.token, userId: data.data.user.id };
  });

  return auth;
}

// ==================== 3. Wardrobe API ====================
async function testWardrobe(token: string) {
  let itemId: string;

  // Create item
  const item = await test('Create Clothing Item', async () => {
    const res = await fetch(`${API_BASE}/api/wardrobe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Test T-Shirt',
        category: '上装',
        color: '白色',
        imageFront: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        tags: ['休闲', '夏季'],
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    itemId = data.data.id;
    return data.data;
  });

  // List items
  await test('List Wardrobe Items', async () => {
    const res = await fetch(`${API_BASE}/api/wardrobe?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { count: data.data.length };
  });

  // Update item
  await test('Update Clothing Item', async () => {
    const res = await fetch(`${API_BASE}/api/wardrobe/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Updated T-Shirt' }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  });

  // Mark as worn
  await test('Mark Item as Worn', async () => {
    const res = await fetch(`${API_BASE}/api/wardrobe/${itemId}/wear`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data;
  });

  return { itemId, item };
}

// ==================== 4. Diary API ====================
async function testDiary(token: string, clothingIds: string[]) {
  // Create entry
  const entry = await test('Create Diary Entry', async () => {
    const res = await fetch(`${API_BASE}/api/diary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        weather: '晴天, 24°C',
        mood: '开心',
        notes: '今天穿得很舒服',
        clothingIds: clothingIds,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  });

  // List entries
  await test('List Diary Entries', async () => {
    const res = await fetch(`${API_BASE}/api/diary?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { count: data.data?.length || 0 };
  });

  return entry;
}

// ==================== 5. Profile API ====================
async function testProfile(token: string) {
  // Get profile
  await test('Get User Profile', async () => {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  });

  // Update profile
  await test('Update User Profile', async () => {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Updated Name',
        heightCm: 175,
        weightKg: 65,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  });
}

// ==================== 6. AI API (Optional) ====================
async function testAI(token: string) {
  // Skip if no AI key configured
  try {
    await test('AI Auto-Tag (if configured)', async () => {
      const res = await fetch(`${API_BASE}/api/ai/auto-tag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        }),
      });
      // May fail if no AI key, that's ok
      if (res.status === 500) {
        return { skipped: 'AI service not configured' };
      }
      const data = await res.json();
      return data;
    });
  } catch (e) {
    console.log('⚠️ AI tests skipped (service not configured)');
  }
}

// ==================== Run All Tests ====================
async function runTests() {
  console.log('🧪 Starting Frontend API Tests...\n');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${API_BASE}\n`);

  try {
    // 1. Health check
    await testHealth();

    // 2. Auth flow
    const auth = await testAuth();
    const token = auth.token;

    // 3. Profile
    await testProfile(token);

    // 4. Wardrobe
    const wardrobe = await testWardrobe(token);

    // 5. Diary
    await testDiary(token, [wardrobe.itemId]);

    // 6. AI (optional)
    await testAI(token);

    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    const passed = results.filter(r => r.status === '✅ PASS').length;
    const failed = results.filter(r => r.status === '❌ FAIL').length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);

    return { success: true, passed, failed, total: results.length };
  } catch (e: any) {
    console.error('\n❌ Test suite failed:', e.message);
    return { success: false, error: e.message, results };
  }
}

// Execute
typeof window === 'undefined' ? runTests().then(console.log) : null;
export { runTests, results };
