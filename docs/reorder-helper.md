# Reorder Helper Notes (T-21.2)

- Accepts an order ID + user ID.
- Fetch order + items; add each product to cart (or return payload) ignoring stock checks.
- Flag missing products (no longer available) so UI can show warnings.

Pseudo:
```ts
const order = await getOrderById(id);
const items = await getOrderItems(id);
const outOfStock = [];
for each item: if product missing → push to outOfStock; else addToCart(user, product, qty).
return { cartItems, outOfStock };
```

Used by `/account/orders` “Reorder” button.
