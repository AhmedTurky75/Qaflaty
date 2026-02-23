# Order Confirmation with Email OTP

## Overview

Currently, when a customer places an order at checkout, the order is created and **immediately confirmed** (`Pending → Confirmed`) in a single step. There is no email verification.

**Goal:** After the customer submits the checkout form, send a 6-digit OTP to their email. The order stays in `Pending` status until the customer enters the correct OTP, at which point it moves to `Confirmed`. This prevents fake/spam orders.

---

## Current Flow (Before)

```
Checkout Form → POST /api/storefront/orders → Order created as Confirmed → Order Confirmation Page
```

## New Flow (After)

```
Checkout Form → POST /api/storefront/orders → Order created as Pending + OTP emailed
    → OTP Verification Page (6 digit input)
        → POST /api/storefront/orders/{orderNumber}/verify → Order Confirmed → Order Confirmation Page
```

---

## Task List

### Backend

- [ ] **1. Add Gmail SMTP settings to appsettings.json**
  - Add an `EmailSettings` section: `SmtpHost`, `SmtpPort`, `SenderEmail`, `SenderName`, `AppPassword`
  - Use Gmail SMTP (`smtp.gmail.com`, port 587, TLS)
  - The `AppPassword` is a Gmail App Password (not the account password)
  - Example config:
    ```json
    "EmailSettings": {
      "SmtpHost": "smtp.gmail.com",
      "SmtpPort": 587,
      "UseSsl": true,
      "SenderEmail": "your-email@gmail.com",
      "SenderName": "Qaflaty",
      "AppPassword": "xxxx xxxx xxxx xxxx"
    }
    ```

- [ ] **2. Create `IEmailService` interface**
  - Location: `src/Qaflaty.Application/Common/Interfaces/IEmailService.cs`
  - Method: `Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct)`

- [ ] **3. Implement `SmtpEmailService`**
  - Location: `src/Qaflaty.Infrastructure/Services/Common/SmtpEmailService.cs`
  - Uses `System.Net.Mail.SmtpClient` (or MailKit) with the Gmail SMTP settings from configuration
  - Register in `Infrastructure/DependencyInjection.cs`

- [ ] **4. Create `OrderOtp` entity**
  - Location: `src/Qaflaty.Domain/Ordering/Aggregates/Order/OrderOtp.cs`
  - Fields: `Id` (Guid), `OrderId`, `Code` (string, 6 digits), `Email` (string), `CreatedAt`, `ExpiresAt`, `IsUsed`, `AttemptCount`
  - Expiry: 10 minutes
  - Max attempts: 5 (to prevent brute-force)
  - Factory method: `Create(OrderId orderId, string email)` — generates a random 6-digit code

- [ ] **5. Create `IOrderOtpRepository` interface**
  - Location: `src/Qaflaty.Domain/Ordering/Repositories/IOrderOtpRepository.cs`
  - Methods:
    - `Task<OrderOtp?> GetActiveByOrderIdAsync(OrderId orderId, CancellationToken ct)`
    - `Task AddAsync(OrderOtp otp, CancellationToken ct)`
    - `void Update(OrderOtp otp)`

- [ ] **6. Implement `OrderOtpRepository`**
  - Location: `src/Qaflaty.Infrastructure/Persistence/Repositories/OrderOtpRepository.cs`
  - Add EF configuration in `Persistence/Configurations/Ordering/OrderOtpConfiguration.cs`
  - Register in `Infrastructure/DependencyInjection.cs`

- [ ] **7. Add EF migration for `OrderOtp` table**
  - Table name: `OrderOtps`
  - Index on `OrderId`
  - Run: `dotnet ef migrations add AddOrderOtp --project src/Qaflaty.Infrastructure --startup-project src/Qaflaty.Api`

- [ ] **8. Modify `PlaceOrderCommandHandler` — stop auto-confirming**
  - Remove the call to `order.Confirm()` at line 143
  - The order will now be saved in `Pending` status
  - After saving, generate an OTP, save it, and send the email
  - **Email is now required** — change `CustomerEmail` from optional to required in `PlaceOrderCommand` validation
  - Return the `OrderDto` (status will be `Pending` instead of `Confirmed`)

- [ ] **9. Create `SendOrderOtpCommand` + handler**
  - Location: `src/Qaflaty.Application/Ordering/Commands/SendOrderOtp/`
  - Purpose: Generates a new OTP for a pending order and emails it (used for resending)
  - Input: `StoreId`, `OrderNumber`
  - Flow: Find order → validate it's Pending → invalidate any existing OTP → create new OTP → send email
  - Rate limit: Only allow resend if last OTP was sent > 60 seconds ago

- [ ] **10. Create `VerifyOrderOtpCommand` + handler**
  - Location: `src/Qaflaty.Application/Ordering/Commands/VerifyOrderOtp/`
  - Input: `StoreId`, `OrderNumber`, `OtpCode` (string, 6 digits)
  - Flow:
    1. Find order by store + order number
    2. Validate order is in `Pending` status
    3. Find active (non-expired, non-used) OTP for this order
    4. Increment attempt count
    5. If code matches: mark OTP as used, call `order.Confirm()`, return success
    6. If code doesn't match: return error with remaining attempts
    7. If max attempts reached: return error (must request new OTP)
    8. If OTP expired: return error (must request new OTP)

- [ ] **11. Create OTP email HTML template**
  - Location: `src/Qaflaty.Infrastructure/Services/Common/EmailTemplates/OrderOtpTemplate.cs`
  - A static method that returns an HTML string with the 6-digit code displayed prominently
  - Include store name, order number, and expiry time (10 minutes)
  - Keep it simple — no external template engine needed

- [ ] **12. Add API endpoints**
  - In `StorefrontOrdersController.cs`:
    - `POST /api/storefront/orders/{orderNumber}/verify` — accepts `{ "otpCode": "123456" }`, calls `VerifyOrderOtpCommand`
    - `POST /api/storefront/orders/{orderNumber}/resend-otp` — calls `SendOrderOtpCommand`

### Frontend (Angular Store App)

- [ ] **13. Add OTP verification methods to `OrderService`**
  - File: `clients/qaflaty-workspace/projects/store/src/app/services/order.service.ts`
  - Add:
    - `verifyOrderOtp(orderNumber: string, otpCode: string): Observable<OrderResponse>`
    - `resendOrderOtp(orderNumber: string): Observable<void>`

- [ ] **14. Create `OtpVerificationComponent`**
  - Location: `clients/qaflaty-workspace/projects/store/src/app/pages/orders/otp-verification.component.ts`
  - Route: `/order-verify/:orderNumber`
  - UI:
    - Header: "Verify Your Order"
    - Subtext: "We sent a 6-digit code to {email}. Enter it below to confirm your order."
    - **6 individual digit input boxes** in a row
    - Each box: `<input maxlength="1">`, auto-focus next on input, auto-focus previous on backspace
    - **Paste support**: listen for `paste` event on the container, split the pasted text into 6 chars, fill all boxes
    - "Verify" button (disabled until all 6 digits are filled)
    - "Resend Code" link with a 60-second cooldown timer ("Resend in 45s")
    - Error messages: wrong code, expired, max attempts reached
    - Success: navigate to `/order-confirmation/:orderNumber`

- [ ] **15. Update `CheckoutComponent` to navigate to OTP page**
  - File: `checkout.component.ts`
  - Change the success handler: instead of navigating to `/order-confirmation/:orderNumber`, navigate to `/order-verify/:orderNumber`
  - Pass the email as a query param or route state so the OTP page can show "sent to {email}"
  - **Make email required** in the checkout form (add `Validators.required` to the email field)
  - Update the email label from "Email (Optional)" to "Email" with a red asterisk

- [ ] **16. Update store app routing**
  - File: `clients/qaflaty-workspace/projects/store/src/app/app.routes.ts`
  - Add route: `{ path: 'order-verify/:orderNumber', component: OtpVerificationComponent }`

### Cleanup / Background

- [ ] **17. Add background cleanup for expired pending orders (optional, future)**
  - Orders left in `Pending` status (unverified) for more than 30 minutes could be auto-cancelled
  - Similar pattern to `GuestCartCleanupService`
  - This is optional for MVP — can be added later

---

## Architecture Notes

### Where things go (following existing patterns)

| What | Where |
|------|-------|
| `IEmailService` | `Qaflaty.Application/Common/Interfaces/` |
| `SmtpEmailService` | `Qaflaty.Infrastructure/Services/Common/` |
| `OrderOtp` entity | `Qaflaty.Domain/Ordering/Aggregates/Order/` |
| `IOrderOtpRepository` | `Qaflaty.Domain/Ordering/Repositories/` |
| `OrderOtpRepository` | `Qaflaty.Infrastructure/Persistence/Repositories/` |
| `VerifyOrderOtpCommand` | `Qaflaty.Application/Ordering/Commands/VerifyOrderOtp/` |
| `SendOrderOtpCommand` | `Qaflaty.Application/Ordering/Commands/SendOrderOtp/` |
| OTP verification page | `clients/.../store/src/app/pages/orders/otp-verification.component.ts` |
| API endpoints | `StorefrontOrdersController.cs` |

### OTP Digit Input Behavior

The 6-digit input works as follows:
- 6 separate `<input>` elements, each accepting 1 digit
- Typing a digit auto-advances focus to the next box
- Pressing Backspace on an empty box moves focus to the previous box
- **Pasting**: intercept the `paste` event, extract up to 6 digits from clipboard, distribute across all boxes
- All non-digit characters are ignored
- When all 6 boxes are filled, the "Verify" button becomes enabled

### Security Considerations

- OTP expires after **10 minutes**
- Maximum **5 attempts** per OTP (prevents brute-force of 6-digit code)
- Resend cooldown of **60 seconds** (prevents email spam)
- OTP is tied to a specific order (cannot be reused)
- Only `Pending` orders can be verified (already confirmed orders return an error)

### Gmail App Password Setup

To use Gmail SMTP for testing:
1. Enable 2-Factor Authentication on the Gmail account
2. Go to Google Account → Security → App passwords
3. Generate an app password for "Mail"
4. Use this 16-character password in `appsettings.json` as `AppPassword`
