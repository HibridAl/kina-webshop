# My Garage Data Model (T-13.1)

_Authors_: backend-alpha (FuchsiaLake)  
_Date_: 2025-12-02

## Goals

- Allow authenticated users to bookmark vehicles they frequently use for fitment checks.
- Support quick switching between saved vehicles, including marking one as the default for catalog/checkout filters.
- Enforce tenant isolation via RLS so each user only sees/edits their entries.
- Provide enough metadata for future polish (display label, created_at ordering, analytics).

## Proposed table: `my_vehicles`

```sql
CREATE TABLE IF NOT EXISTS my_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  label TEXT, -- optional user-defined nickname ("Family SUV")
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT my_vehicles_owner_vehicle_unique UNIQUE (user_id, vehicle_id)
);
```

### Default constraint

We only want a single default vehicle per user. Instead of a table-level constraint (which would have to touch every row), add a partial unique index:

```sql
CREATE UNIQUE INDEX idx_my_vehicles_default_user
  ON my_vehicles(user_id)
  WHERE is_default;
```

When toggling defaults the application logic should:

1. Run the update inside a transaction.
2. Clear the previous default (`UPDATE my_vehicles SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`).
3. Set the new default (respecting the unique index).

### Helpful indexes

- `CREATE INDEX idx_my_vehicles_user_id_created ON my_vehicles(user_id, created_at DESC);` – speeds up `getMyVehicles` ordering.
- `CREATE INDEX idx_my_vehicles_vehicle_id ON my_vehicles(vehicle_id);` – enables reporting/coverage queries (e.g., how many users saved a vehicle).

## RLS policies

Enable RLS and apply per-user policies, mirroring existing `cart_items` rules:

```sql
ALTER TABLE my_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own garage" ON my_vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users modify own garage" ON my_vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id)
  TO authenticated;

CREATE POLICY "Users update own garage" ON my_vehicles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own garage" ON my_vehicles
  FOR DELETE USING (auth.uid() = user_id);
```

(If we ever add server-side automation, e.g., “remove vehicle when account deleted”, we can run with the service role key which bypasses RLS.)

## TypeScript & helpers (preview for T-13.3)

Add a new interface in `lib/types.ts`:

```ts
export interface SavedVehicle {
  id: string;
  vehicle_id: string;
  user_id: string;
  label: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  vehicles?: Vehicle | null; // optional join for richer UI
}
```

Helpers to plan for T-13.3:

- `getMyVehicles(userId: string)` – returns rows ordered by `is_default DESC, created_at DESC`.
- `addVehicleToGarage(userId, vehicleId, label?)` – enforces max garage size later if needed.
- `removeVehicleFromGarage(userId, vehicleId)`.
- `setDefaultVehicle(userId, vehicleId)` – wraps the two-step default toggle described earlier.

## API/UI touchpoints

- `/account` + header drop-down will need a simple API route (`/app/api/my-garage`) so client components can fetch via signed requests.
- Vehicle detail + compatibility pages call `addVehicleToGarage` / `removeVehicleFromGarage` depending on current state.

## Out of scope (future backlog)

- Analytics on most-saved vehicles (requires aggregation table or matview).
- Sharing garage between org members (B2B) – would need group_id column.
- Limits per user (e.g., max 10 entries) – decide later; enforce via check constraint if added.

This design feeds directly into T-13.2 (migration/RLS) and T-13.3 (helpers). Once merged we can wire the UI work in T-14.*.
