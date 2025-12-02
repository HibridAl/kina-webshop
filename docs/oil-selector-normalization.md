# Oil Selector Normalization (T-17.1)

_Date_: 2025-12-02  
_Author_: backend-alpha (FuchsiaLake)

## Goals
- Convert manufacturer/OEM oil recommendations into a normalized schema suitable for display, upsell, and analytics.
- Map each recommendation to an internal SKU when available.
- Capture enough metadata (viscosity, spec codes, temperature range) for future filtering.

## Proposed tables

### `vehicle_oil_recommendations`
```sql
CREATE TABLE IF NOT EXISTS vehicle_oil_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  manufacturer_label TEXT NOT NULL,      -- e.g. "5W-30 Synthetic"
  viscosity VARCHAR(32) NOT NULL,        -- normalized (5W-30)
  specification_code TEXT,               -- e.g. VW 504 00
  temperature_range TEXT,                -- optional string for display
  notes TEXT,
  product_sku VARCHAR(100),              -- link to internal products.sku
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT vehicle_oil_rec_unique UNIQUE(vehicle_id, viscosity, specification_code)
);
```

### `oil_specifications` (lookup)
Optional reference table for manufacturer codes → friendly names.

```sql
CREATE TABLE IF NOT EXISTS oil_specifications (
  code TEXT PRIMARY KEY,
  description TEXT,
  manufacturer TEXT,
  base_viscosity TEXT
);
```

## Normalization steps
1. **Ingestion** (scripts/02-oil-selector.sql): load raw manufacturer data into a staging table (manufacturer, model, year range, raw spec text).
2. **Parsing**: use SQL/JS functions to split raw text into viscosity + spec codes.
3. **Mapping**: maintain a YAML/JSON map of manufacturer spec → internal SKU. Example:
   ```json
   {
     "MG": {
       "5W-30": "MG4-OIL-001",
       "0W-20": "UNIV-OIL-002"
     }
   }
   ```
4. **Insert**: upsert into `vehicle_oil_recommendations` with the normalized fields.
5. **Validation**: flag entries where SKU is missing so ops can fill in.

## Related code updates
- `lib/oil-selector.ts`: expose helpers (`getOilRecommendations(vehicleId)`).
- `scripts/ingest-autok-to-supabase.sql`: integrate the normalization step after raw data import.

## Open questions
- Do we need viscosity ranges per climate? (Future enhancement.)
- Should we support multiple SKUs per vehicle? (For now, single best recommendation.)

This document guides T-17.2 implementation and T-18 upsell work.
