# Admin Bulk Edit API (T-26.1)

## Endpoint
`POST /api/admin/products/bulk`

### Request
```json
{
  "action": "update_price",          // or update_status/export
  "product_ids": ["..."],
  "payload": {
    "price": 99.99,
    "status": "active"
  }
}
```

### Response
```json
{
  "success": true,
  "processed": 10,
  "failed": [ {"id": "prod-1", "reason": "not found"} ]
}
```

## Actions
- `update_price`: set new price for list (supports percentage adjustments later).
- `update_status`: change availability/status.
- `export`: optional, returns CSV of selected products.

## Constraints
- RBAC: admin role only (reuse requireAdmin helper).
- Transaction handling: wrap in transaction per action.
- Audit logging: record user_id and payload (future enhancement).

## Follow-up
- Add rate limiting / batching if needed.
- UI consumes the JSON format for success/errors.
