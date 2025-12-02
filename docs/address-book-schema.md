# Address Book Data Model (T-19.1)

_Date_: 2025-12-02  
_Author_: backend-alpha (FuchsiaLake)

## Goals
- Persist multiple shipping/billing addresses per user (supporting B2C + future B2B variants).
- Allow separate defaults for shipping and billing.
- Store metadata needed for checkout autofill and admin review.

## Table: `addresses`

```sql
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'personal',        -- personal | business | other
  label TEXT,                                          -- e.g. "Home", "Warehouse"
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  vat_id TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  phone TEXT,
  is_default_shipping BOOLEAN NOT NULL DEFAULT FALSE,
  is_default_billing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_addresses_default_shipping
  ON addresses(user_id)
  WHERE is_default_shipping;

CREATE UNIQUE INDEX idx_addresses_default_billing
  ON addresses(user_id)
  WHERE is_default_billing;

CREATE INDEX idx_addresses_user ON addresses(user_id, created_at DESC);
```

### Default toggling
Same approach as My Garage: when marking an address default shipping/billing, clear the previous defaults inside a transaction.

### RLS policies

```sql
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own addresses" ON addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own addresses" ON addresses
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Service-role automation (e.g., cleanup) can bypass RLS.

## Future considerations
- Validate country/postal format (optional per region).
- Support archived addresses (soft delete) if needed.
- Hook into reorder helper (T-21.2) to reuse address snapshots.

This schema feeds T-19.2 (migration/RLS) and T-19.3 (helpers/APIs).
