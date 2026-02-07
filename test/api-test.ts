const API_BASE = 'http://localhost:3000';

async function test(name: string, fn: () => Promise<any>) {
  try {
    const result = await fn();
    console.log(`✅ ${name}`);
    return { name, status: 'PASS', result };
  } catch (error: any) {
    console.log(`❌ ${name}: ${error.message}`);
    return { name, status: 'FAIL', error: error.message };
  }
}

async function runTests() {
  const results: any[] = [];
  console.log('🧪 Frontend API Test Suite\n');
  console.log(`Testing: ${API_BASE}\n`);

  // 1. Health Check
  results.push(await test('Health Check', async () => {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (!data.success) throw new Error('Health check failed');
    return data;
  }));

  // 2. User Registration
  const timestamp = Date.now();
  const email = `test${timestamp}@example.com`;
  const password = 'Test123456';
  const username = `TestUser${timestamp}`;

  results.push(await test('User Registration', async () => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    const data = await res.json();
    if (!data.success && data.error?.code !== 'CONFLICT') throw new Error(data.message);
    return { created: data.success, message: data.message };
  }));

  // 3. User Login
  const loginResult = await test('User Login', async () => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    return { token: data.data.token, userId: data.data.user.id };
  });
  results.push(loginResult);

  if (loginResult.status === 'PASS') {
    const token = loginResult.result.token;

    // 4. Get Profile
    results.push(await test('Get User Profile', async () => {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { hasProfile: !!data.data };
    }));

    // 5. List Wardrobe
    results.push(await test('List Wardrobe (Empty)', async () => {
      const res = await fetch(`${API_BASE}/api/wardrobe?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { count: data.data?.length || 0 };
    }));

    // 6. Create Wardrobe Item
    const createResult = await test('Create Clothing Item', async () => {
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
          imageFront: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAbV/2Q==',
          tags: ['休闲', '夏季'],
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { itemId: data.data.id, item: data.data.name };
    });
    results.push(createResult);

    // 7. List Diary
    results.push(await test('List Diary Entries', async () => {
      const res = await fetch(`${API_BASE}/api/diary?page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { count: data.data?.length || 0 };
    }));
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);

  return results;
}

runTests().then(() => process.exit(0));
