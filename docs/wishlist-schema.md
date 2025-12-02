# Wishlist Data Model (T-22.1)

_Date_: 2025-12-02  
_Author_: backend-alpha (FuchsiaLake)

## Goals
- Allow each user to bookmark products for later (MVP: single wishlist per user).
- Prevent duplicate product entries per user.
- Set the stage for future multi-wishlist support.

## Tables

### `wishlists`
```sql
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'My Wishlist',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT wishlists_user_unique UNIQUE (user_id)
);
```

### `wishlist_items`
```sql
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT wishlist_items_unique UNIQUE (wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product ON wishlist_items(product_id);
```

## RLS
```sql
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own wishlist" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own wishlist items" ON wishlist_items
  FOR SELECT USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

CREATE POLICY "Users manage own wishlist items" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  )
  WITH CHECK (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );
```

## Future enhancements
- Support multiple wishlists per user (remove UNIQUE constraint, add `name` + `is_default`).
- Shareable wishlists (requires slug + optional public token).

This feeds T-22.2 (migration) and T-23.* UI work.
