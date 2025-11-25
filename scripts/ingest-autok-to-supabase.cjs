// Plain Node.js ingestion script (CommonJS) so you can run:
//   node scripts/ingest-autok-to-supabase.cjs
//
// It reads autok.txt (JSON) and pushes MG/BYD/Omoda/Geely/Haval data
// into the oil_recommendations table in Supabase.

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { parser } = require('stream-json');
const { streamObject } = require('stream-json/streamers/StreamObject');
// Load env from .env.local / .env so we can reuse the same keys as the app
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config();

const CHINESE_MAKES = ['MG', 'BYD', 'Omoda', 'Geely', 'Haval'];

// Prefer server-only vars if present, fall back to NEXT_PUBLIC_* for local dev
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[oil-ingest] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_ equivalents) environment variables.'
  );
  process.exit(1);
}

// Path to the big autok.txt JSON file (can be overridden via AUTOK_PATH env var)
const AUTOK_PATH = process.env.AUTOK_PATH || path.resolve(process.cwd(), 'autok.txt');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function loadChineseMakesFromFile() {
  console.log('[oil-ingest] Reading source file (streaming):', AUTOK_PATH);

  return new Promise((resolve, reject) => {
    const dataset = {};

    const stream = fs
      .createReadStream(AUTOK_PATH, { encoding: 'utf-8' })
      .pipe(parser())
      .pipe(streamObject());

    stream.on('data', ({ key, value }) => {
      // Root-level key is the make, e.g. "Abarth", "MG"
      if (CHINESE_MAKES.includes(key)) {
        dataset[key] = value;
      }
    });

    stream.on('end', () => {
      resolve(dataset);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

function buildRowsForMake(make, makeEntry) {
  const rows = [];

  for (const [modelKey, modelEntry] of Object.entries(makeEntry)) {
    for (const [, vehicleRecord] of Object.entries(modelEntry)) {
      const { vehicle, results } = vehicleRecord;

      for (const [systemName, system] of Object.entries(results || {})) {
        rows.push({
          make: vehicle.make,
          model: vehicle.model,
          type: vehicle.type,
          hash: vehicle.hash,
          system_name: systemName,
          capacities: system.capacities ?? null,
          uses: system.uses ?? null,
        });
      }
    }
  }

  return rows;
}

async function upsertRows(rows) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    console.log(
      `[oil-ingest] Upserting rows ${i + 1}-${i + chunk.length} of ${rows.length}...`
    );
    const { error } = await supabase
      .from('oil_recommendations')
      .upsert(chunk, {
        onConflict: 'make,model,type,hash,system_name',
      });

    if (error) {
      console.error('[oil-ingest] Supabase upsert error:', error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    const dataset = await loadChineseMakesFromFile();

    for (const make of CHINESE_MAKES) {
      const makeEntry = dataset[make];
      if (!makeEntry) {
        console.warn(
          `[oil-ingest] No data found for make "${make}" in autok dataset. Skipping.`
        );
        continue;
      }

      console.log(`[oil-ingest] Processing make: ${make}`);

      const rows = buildRowsForMake(make, makeEntry);

      if (rows.length === 0) {
        console.warn(`[oil-ingest] No rows generated for make "${make}". Skipping upsert.`);
        continue;
      }

      await upsertRows(rows);
      console.log(
        `[oil-ingest] Finished ingesting ${rows.length} recommendation rows for make "${make}".`
      );
    }

    console.log('[oil-ingest] Done.');
  } catch (err) {
    console.error('[oil-ingest] Failed:', err);
    process.exit(1);
  }
}

main();


