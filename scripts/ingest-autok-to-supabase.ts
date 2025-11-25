import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type {
  OilSelectorDataset,
  OilSelectorMakeEntry,
  OilSelectorModelEntry,
  OilSelectorVehicleRecord,
  OilSelectorSystem,
} from '@/lib/oil-selector';
import { CHINESE_MAKES } from '@/lib/oil-selector';

type RecommendationRow = {
  make: string;
  model: string;
  type: string;
  hash: string;
  system_name: string;
  capacities: string[] | null;
  uses: Record<string, any> | null;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.error(
    '[oil-ingest] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
  process.exit(1);
}

// Path to the big autok.txt JSON file (can be overridden via AUTOK_PATH env var)
const AUTOK_PATH =
  process.env.AUTOK_PATH ||
  path.resolve(process.cwd(), 'autok.txt');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function loadAutokFile(): OilSelectorDataset {
  // eslint-disable-next-line no-console
  console.log('[oil-ingest] Reading source file:', AUTOK_PATH);

  const raw = fs.readFileSync(AUTOK_PATH, 'utf-8');
  // The file is expected to be a JSON object in the structure:
  // { "Abarth": { "Model key": { "urlHashKey": { vehicle, results } } }, ... }
  const parsed = JSON.parse(raw) as OilSelectorDataset;
  return parsed;
}

function buildRowsForMake(
  make: string,
  makeEntry: OilSelectorMakeEntry
): RecommendationRow[] {
  const rows: RecommendationRow[] = [];

  for (const [modelKey, modelEntry] of Object.entries<OilSelectorModelEntry>(makeEntry)) {
    for (const [, vehicleRecord] of Object.entries<OilSelectorVehicleRecord>(modelEntry)) {
      const { vehicle, results } = vehicleRecord;

      for (const [systemName, system] of Object.entries<OilSelectorSystem>(
        results as any
      )) {
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

async function upsertRows(rows: RecommendationRow[]) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    // eslint-disable-next-line no-console
    console.log(
      `[oil-ingest] Upserting rows ${i + 1}-${i + chunk.length} of ${rows.length}...`
    );
    const { error } = await supabase
      .from('oil_recommendations')
      .upsert(chunk, {
        onConflict: 'make,model,type,hash,system_name',
      });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('[oil-ingest] Supabase upsert error:', error.message);
      throw error;
    }
  }
}

async function main() {
  try {
    const dataset = loadAutokFile();

    for (const make of CHINESE_MAKES) {
      const makeEntry = dataset[make];
      if (!makeEntry) {
        // eslint-disable-next-line no-console
        console.warn(
          `[oil-ingest] No data found for make "${make}" in autok dataset. Skipping.`
        );
        continue;
      }

      // eslint-disable-next-line no-console
      console.log(`[oil-ingest] Processing make: ${make}`);

      const rows = buildRowsForMake(make, makeEntry as OilSelectorMakeEntry);

      if (rows.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[oil-ingest] No rows generated for make "${make}". Skipping upsert.`);
        continue;
      }

      await upsertRows(rows);
      // eslint-disable-next-line no-console
      console.log(
        `[oil-ingest] Finished ingesting ${rows.length} recommendation rows for make "${make}".`
      );
    }

    // eslint-disable-next-line no-console
    console.log('[oil-ingest] Done.');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[oil-ingest] Failed:', err);
    process.exit(1);
  }
}

main();


