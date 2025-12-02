# Search Autocomplete UX Specification

## Overview
The global header search will be enhanced with an autocomplete dropdown that provides instant feedback as the user types. It serves as the primary entry point for finding products, vehicle models (OEM), and categories.

## Interaction Design

### Trigger
- **Event**: User focuses the search input field or starts typing.
- **Minimum characters**: 2 characters to trigger a fetch (to avoid noise).
- **Debounce**: 300ms delay before triggering the network request.

### States
1.  **Idle/Empty**: Input is empty. Show nothing or "Popular searches" if we have history (optional v2).
2.  **Loading**: Small spinner or skeleton loader inside the dropdown.
3.  **Results**: List of matches grouped by type.
4.  **No Results**: "No products found for 'xyz'".

### Result Groups & Layout
The dropdown will be divided into sections:
1.  **Suggestions** (Matching keywords/terms) - *Icon: Search*
2.  **Categories** (Matching category names) - *Icon: Folder/Grid*
3.  **OEM / Models** (Matching vehicle models or OEM numbers) - *Icon: Car*
4.  **Products** (Direct product matches) - *Icon: Package*

**Visual Hierarchy**:
- **Group Title**: Small, uppercase, muted text (e.g., "SUGGESTIONS").
- **Item**:
    - **Left**: Icon.
    - **Center**: Text (highlight matching substring if possible).
    - **Right**: Optional metadata (e.g., "Category", or Price for products).

### Navigation (Keyboard & Mouse)
- **Mouse**: Hover highlights the row. Click navigates to the result URL.
- **Keyboard**:
    - `ArrowDown`: Move selection down.
    - `ArrowUp`: Move selection up.
    - `Enter`: Navigate to the selected item's URL. If no item selected, submit the form (search page).
    - `Escape`: Close the dropdown.
- **Focus Management**: When dropdown opens, focus remains in the input. Arrows move a "visual focus" (active state) in the list.

### Mobile Considerations
- On mobile, the search might expand to cover the full header or open a full-screen modal to avoid keyboard overlap issues.
- Tap targets must be at least 44px height.
- "X" button to clear input easily.

## API Interface (Expected)
**Endpoint**: `GET /api/search/suggest?q=...`
**Response Schema**:
```json
{
  "suggestions": [
    { "text": "brake pads", "type": "term" }
  ],
  "categories": [
    { "id": "cat-123", "name": "Brake Systems", "slug": "brake-systems" }
  ],
  "products": [
    { "id": "prod-456", "name": "Front Brake Pad Set", "sku": "BP-001", "image": "url", "price": 45.99 }
  ]
}
```
