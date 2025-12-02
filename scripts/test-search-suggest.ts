import { NextRequest } from 'next/server';
import { GET as searchSuggestHandler } from '@/app/api/search/suggest/route';

type Assertion = () => Promise<void>;

function buildRequest(params: Record<string, string | number | undefined>) {
  const url = new URL('http://localhost/api/search/suggest');
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }
  return new NextRequest(url);
}

async function runTest(name: string, assertion: Assertion) {
  try {
    await assertion();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.error(`❌ ${name}:`, error);
    throw error;
  }
}

interface SuggestResponse {
  query: string;
  suggestions: Array<{ text: string; type: string }>;
  categories: Array<{ id: string; name: string }>;
  vehicles: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
}

async function getJson(params: Record<string, string | number | undefined>) {
  const request = buildRequest(params);
  const response = await searchSuggestHandler(request);
  if (!response.ok) {
    throw new Error(`Expected 200 OK, got ${response.status}`);
  }
  return (await response.json()) as SuggestResponse;
}

async function main() {
  await runTest('Empty query returns popular suggestions', async () => {
    const json = await getJson({ q: '' });
    if (json.suggestions.length === 0) {
      throw new Error('Expected popular suggestions for empty query');
    }
  });

  await runTest('One-character query falls back to popular data', async () => {
    const json = await getJson({ q: 'b' });
    if (json.query !== 'b') {
      throw new Error('Query echo mismatch');
    }
    if (json.suggestions.length === 0) {
      throw new Error('Expected popular suggestions when query < 2 chars');
    }
  });

  await runTest('Known term includes products/categories', async () => {
    const json = await getJson({ q: 'brake' });
    if (!json.products.some((p) => p.name.toLowerCase().includes('brake'))) {
      throw new Error('Expected brake product suggestions');
    }
    if (!json.categories.some((c) => c.name.toLowerCase().includes('brake'))) {
      throw new Error('Expected brake category suggestion');
    }
  });

  await runTest('Unknown query gracefully returns empty groups', async () => {
    const json = await getJson({ q: 'zzz-notreal' });
    if (json.products.length !== 0 || json.categories.length !== 0 || json.vehicles.length !== 0) {
      throw new Error('Expected no matches for nonsense query');
    }
  });

  console.log('All suggestion tests passed.');
}

main().catch((error) => {
  console.error('Search suggestion tests failed:', error);
  process.exitCode = 1;
});
