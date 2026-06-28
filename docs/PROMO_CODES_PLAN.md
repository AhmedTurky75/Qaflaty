# Promo Codes / Discounts — Plan

**Context:** Catalog (store-owned configuration, alongside `PaymentMethodDefinition` and `DeliveryZone`)
**Status flag:** `FeatureToggles.PromoCodes` already exists (default `false`) — this feature gives it meaning.

---

## 1. Business goals

Merchants need to run promotions to drive conversion and reward customers. A promo code is a
store-scoped, merchant-defined coupon a shopper enters at checkout to reduce the amount payable.

### Discount types
| Type | Meaning | `Value` |
|------|---------|---------|
| `Percentage` | % off the cart subtotal | 0–100 |
| `FixedAmount` | Flat amount off the subtotal | money |
| `FreeShipping` | Waives the delivery fee | ignored |

### Rules a merchant can configure per code
- **Code** — case-insensitive, unique per store (stored uppercased).
- **Active window** — optional `StartsAt` / `ExpiresAt`.
- **Minimum order amount** — code only valid when subtotal ≥ threshold.
- **Maximum discount amount** — caps a percentage discount (e.g. "10% off, up to 50 SAR").
- **Total usage limit** — global redemption cap across all shoppers.
- **Per-customer usage limit** — how many times one customer may use it.
- **Active toggle** — enable/disable without deleting.

### Who can use it
Both **guests** and **logged-in customers** at checkout. Per-customer limits are enforced against
the `Ordering.Customer` aggregate, which is keyed by phone number — so a guest who checks out with
the same phone is recognised as the same customer.

---

## 2. Domain model (Catalog)

**`PromoCode` aggregate** (`PromoCodeId`)
- `StoreId`, `Code`, `Description`
- `DiscountType`, `Value`, `MinimumOrderAmount?`, `MaxDiscountAmount?`
- `StartsAt?`, `ExpiresAt?`, `UsageLimit?`, `UsageLimitPerCustomer?`, `TimesUsed`
- `IsActive`, `CreatedAt`, `UpdatedAt`
- Behaviour: `Create`, `Update`, `Activate`/`Deactivate`,
  `Validate(subtotal, now, customerRedemptionCount) -> Result`,
  `CalculateDiscount(subtotal, deliveryFee) -> decimal`, `RecordRedemption()`

**`PromoCodeRedemption` entity** (tracking) — `PromoCodeId`, `OrderId`, `CustomerId`,
`DiscountAmount`, `RedeemedAt`. Used to enforce per-customer limits and for reporting.

---

## 3. Order integration (Ordering)

`OrderPricing` gains `DiscountAmount`; `Total = Subtotal + DeliveryFee − DiscountAmount`.
`Order` records the applied code (`AppliedPromoCode`) and exposes `ApplyDiscount(code, amount)`.

`PlaceOrderCommand` gains an optional `PromoCode`. The handler:
1. Loads the code, counts the customer's prior redemptions, calls `Validate`.
2. Computes the discount, applies it to the order, records a `PromoCodeRedemption`,
   and increments `TimesUsed`.
3. A bad/expired code fails the order with a clear error (storefront validates first, so this is a guard).

---

## 4. API

**Storefront (public)**
- `POST /api/storefront/promo/validate` — `{ code, items[] }` → discount preview (subtotal computed server-side).

**Merchant (authorized)** — `api/stores/{storeId:guid}/promo-codes`
- `GET` list, `POST` create, `PUT /{id}` update, `DELETE /{id}`, `POST /{id}/toggle`.

---

## 5. Frontend
- **Merchant:** promo-codes feature module — list + create/edit form, activate toggle.
- **Store:** promo input on the cart/checkout page calling the validate endpoint, showing the
  discount line and updated total.

---

## 6. Migration
`AddPromoCodes` — creates `promo_codes` + `promo_code_redemptions`, adds
`discount_amount` / `discount_currency` / `applied_promo_code` to `orders`.
