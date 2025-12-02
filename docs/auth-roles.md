# Auth & Role Model (T-25.1)

## Roles
- `user` (default) – standard customer
- `admin` – full admin access
- `support` – read-only admin views + limited mutations (future)
- `viewer` – view-only admin (future)

Fields: extend `users` table with `role` ENUM-like TEXT (already present) plus optional `is_b2b`.

## Policies
- Admin routes/components should check `role === 'admin'` (or `support` where appropriate).
- `/app/api/admin/**` endpoints validate bearer token, fetch profile, ensure role.
- UI: `/admin` layout gate → show error page if role insufficient.

## Future work
- Support B2B flag: different pricing, address book defaults.
- Support per-resource permissions when needed.
