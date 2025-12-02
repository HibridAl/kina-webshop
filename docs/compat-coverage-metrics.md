# Compatibility Coverage Metrics (T-15.1)

_Date_: 2025-12-02  
_Author_: backend-alpha (FuchsiaLake)

## Purpose

Provide a consistent set of KPIs for the compatibility/oil-selector roadmap so the admin dashboard (T-16) can monitor progress, identify gaps, and prioritize ingestion work.

## Source tables
- `vehicles` – master list of supported vehicles.
- `vehicle_product_compatibility` – mapping between vehicles and compatible products.
- `products` (subset by category) – to differentiate oil recommendations vs. other fitment.
- `vehicle_oil_recommendations` (after T-17) – normalized oil data.

## Metrics

| KPI | Definition | SQL Sketch |
| --- | --- | --- |
| Vehicles with fitment | Count of vehicles that have at least one row in `vehicle_product_compatibility`. | `SELECT COUNT(DISTINCT vehicle_id) FROM vehicle_product_compatibility;` |
| Coverage % | `vehicles_with_fitment / total_vehicles * 100`. | `SELECT (fitment.count::decimal / NULLIF(total.count,0)) * 100 ...` |
| Vehicles with oil recommendation | Vehicles with at least one normalized oil entry referencing a SKU. | Depends on T-17 table (`vehicle_oil_recommendations`). |
| Gaps by brand | Vehicles grouped by brand with zero compatibility rows. | Join `vehicles -> models -> brands` and filter `NOT EXISTS (compatibility ...)`. |
| Gaps by category | For each product category (e.g. brakes, suspension), % of vehicles lacking fitment. | Requires joining compat rows filtered by category_id. |
| Recent ingestion wins | Vehicles added in last N days that now have coverage. | `WHERE vehicles.created_at >= now() - interval '30 days' AND EXISTS (...)`. |
| Oil upsell readiness | Vehicles with both oil recommendation + associated SKU available. | `WHERE EXISTS oil_rec JOIN products ON SKU` |

## Filters / dimensions

Backend endpoint should accept optional filters:
- `brand_id`
- `category_id` (product category)
- `fuel_type` (from `vehicles.specifications ->> 'fuel_type'`)

## JSON payload structure (preview for T-15.2)

```json
{
  "totals": {
    "vehicles": 1200,
    "with_fitment": 860,
    "fitment_pct": 71.7,
    "with_oil": 540,
    "oil_pct": 45.0
  },
  "brand_gaps": [
    { "brand": "MG", "total": 200, "uncovered": 40, "uncovered_pct": 20 },
    ...
  ],
  "category_gaps": [
    { "category": "Brakes", "covered_pct": 68 },
    ...
  ],
  "oil_readiness": {
    "vehicles_with_recommendation": 540,
    "vehicles_with_sku_match": 480
  }
}
```

## Considerations

- Large tables: precompute via materialized views if queries become slow (T-15.2 can start with direct SQL and optimize later).
- Data freshness: aim for <1h staleness; daily cron acceptable initially.
- Missing data handling: if `products` lack category metadata, flag as `unknown` category in the output.

This document feeds into T-15.2 (API implementation) and T-16 (dashboard UI).
