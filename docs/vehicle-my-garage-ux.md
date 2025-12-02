# My Garage UX Specification (T-14.1)

## Overview
"My Garage" is a personalization feature allowing users to save vehicles to their profile. It streamlines the browsing experience by enabling 1-click filtering of the entire catalog for their specific car.

## User Stories
1.  **Save a Vehicle:** As a user browsing a vehicle page, I want to save this configuration so I don't have to re-enter it next time.
2.  **Access Garage:** As a user, I want to quickly access my saved vehicles from the header or account menu.
3.  **Filter by Garage:** As a user, I want to apply a saved vehicle's filter to the product catalog with one click.
4.  **Manage Garage:** As a user, I want to remove old vehicles or set a "primary" vehicle.

## UI Components & Interaction Design

### 1. Add/Remove Button (Vehicle Detail & Compatibility View)
-   **Location:**
    -   **Vehicle Detail Page:** Prominent button near the vehicle title/hero section.
    -   **Compatibility Card:** Icon button (heart or garage icon) in the vehicle selector summary.
-   **States:**
    -   **Not Saved:** Outline icon + "Save to Garage". Action: Adds to DB, changes to saved state, toast notification "Vehicle saved".
    -   **Saved:** Filled icon + "Saved". Action: Opens confirmation dialog "Remove from Garage?", then removes.
-   **Guest Behavior:** If not logged in, clicking "Save" redirects to login/register (with `next` param).

### 2. Header "My Garage" Menu
-   **Location:** Between "Vehicles" link and "Account" or inside the Account dropdown (Decision: Dedicated icon or subsection in Account? -> **Subsection in Account Dropdown** for MVP to save header space, plus a quick-access item if space permits).
    -   *Refinement:* Let's put a **Car Icon** in the header actions (next to Cart) if the user has saved vehicles. If empty, it's hidden.
-   **Dropdown Content:**
    -   List of saved vehicles (Year Make Model Trim).
    -   Badge for "Default" vehicle.
    -   **Action:** Clicking a vehicle row -> Redirects to `/products?vehicleId=...` (applying the filter).
    -   "Manage Garage" link -> Goes to `/account/garage`.

### 3. Account Page Section (`/account/garage`)
-   **Layout:** Grid of cards, one per vehicle.
-   **Card Content:**
    -   Vehicle Image (placeholder or brand logo).
    -   Title: Year Make Model.
    -   Subtitle: Trim / Engine code.
    -   **Actions:**
        -   "Shop Parts" (Primary CTA).
        -   "Make Default" (Toggle).
        -   "Remove" (Destructive).

## Mobile Considerations
-   **Header:** The Car icon sits in the top nav bar. Tapping opens a bottom sheet (Drawer) with the vehicle list instead of a dropdown.
-   **Vehicle Page:** "Save" button is sticky or prominent in the initial viewport.

## Technical Data Requirements
-   **Read:** List of `my_vehicles` (joined with `vehicles` -> `models` -> `brands`).
-   **Write:** `addVehicle`, `removeVehicle`.
-   **State:** Client-side optimization – optimistically update UI on save/remove.

## Mockups (Conceptual)

**Header Dropdown:**
```
[Car Icon]
  My Garage
  ----------------
  2023 MG 4 Electric [Default]
  2022 BYD Atto 3
  ----------------
  + Add current vehicle
  Manage Garage
```

**Vehicle Page Action:**
`[ Heart Icon ] Save to Garage` vs `[ Filled Heart ] Saved`
