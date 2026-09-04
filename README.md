# ZMEX — Banking Money Transfer System

A full-stack banking application that allows users to create an account, manage their balance, add demo funds, transfer money securely between ZMEX accounts, and track complete transaction history.
**Live:** `https://zmex.vercel.app/`
---


## Tech Stack

**Frontend**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

**Backend**
- Next.js Route Handlers
- Zod validation
- bcrypt password hashing
- JWT sessions using `jose`

**Database**
- PostgreSQL — Neon
- Drizzle ORM

**Redis**
- Upstash Redis (Rate limiting)

---

## Features

- Two-step user registration
- Secure login and logout
- Automatic ZMEX account creation (`ZM` + 12 digits)
- Optional opening balance during registration
- Real-time account balance & account number display
- Demo Add Money flow (UPI, Debit Card, Credit Card)
- Beneficiary account lookup & instant identity verification
- Secure money transfers between ZMEX accounts
- Multi-tier validation blocking transfers exceeding available balance
- Multi-tier self-transfer prevention
- Double-entry ledger audit trailing (`ledger_entries`)
- Paginated transaction history with credit/debit direction
- Idempotent transfer and deposit requests via `Idempotency-Key` header
- Row-level lock ordering (`FOR UPDATE`) for deadlock-free concurrent transfers
- Upstash Redis-backed sliding window transfer rate limiting
- Responsive desktop and mobile interface
- Real-time UI refresh after transactions with smooth Skeleton loaders

---

## Screenshots

### Register 

<img width="1907" height="862" alt="Image" src="https://github.com/user-attachments/assets/bebd1ec0-07ca-44f6-86ed-05d0463bf9c4" />

<img width="1908" height="862" alt="Image" src="https://github.com/user-attachments/assets/60c12d44-d9ff-444b-bd61-c99d14da77e3" />



### Login

<img width="1296" height="856" alt="Image" src="https://github.com/user-attachments/assets/79834bff-97b7-4b2f-8a6d-487ae6ed5907" />

### Dashboard

<img width="1905" height="857" alt="Image" src="https://github.com/user-attachments/assets/dd2e4eb5-781e-4333-a7ee-a590b61c8d08" />

### Add Money

<img width="1158" height="847" alt="Image" src="https://github.com/user-attachments/assets/f1ce739f-598e-4aed-b81b-20de337420bd" />

<img width="1560" height="860" alt="Image" src="https://github.com/user-attachments/assets/fff67117-710e-4c9a-91be-159729bf4b4b" />

### Transfer Money

<img width="1905" height="862" alt="Image" src="https://github.com/user-attachments/assets/1eb7c3eb-925f-4ea2-9076-d7ea7f4cc283" />

### Transfer Success

<img width="1912" height="863" alt="Image" src="https://github.com/user-attachments/assets/93f1eefa-60be-4c65-83e7-32c21c448a05" />

### Transaction History

<img width="1177" height="852" alt="Image" src="https://github.com/user-attachments/assets/6b1d156e-e1e2-4e5f-9469-a3ea42c2545e" />

---

## Project Structure

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (banking)/
│   │   ├── dashboard/
│   │   ├── deposit/
│   │   ├── transactions/
│   │   └── transfer/
│   └── api/
│       ├── account/
│       ├── accounts/
│       │   └── lookup/
│       ├── auth/
│       ├── deposits/
│       ├── transactions/
│       └── transfers/
│
├── components/
│   ├── auth/
│   ├── banking/
│   ├── deposit/
│   ├── transactions/
│   ├── transfer/
│   └── ui/
│
├── modules/
│   ├── accounts/
│   ├── auth/
│   ├── deposits/
│   ├── transactions/
│   └── transfers/
│
├── db/
│   ├── schema/
│   └── index.ts
│
├── lib/
│   ├── auth/
│   ├── client/
│   └── redis.ts
│
└── shared/
    ├── errors/
    ├── http/
    ├── money/
    └── validation/
```

---
## Local Setup

### Prerequisites
- Node.js 18+
- Neon PostgreSQL database
- Upstash Redis database (optional for local rate limiting)

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd zmex
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create `.env.local` in the root directory:

```env
DATABASE_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/zmex?sslmode=require"
AUTH_SECRET="your-secure-auth-secret-min-32-characters"

# Optional Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL="https://sample.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### 4. Database Setup
Generate and apply migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start ZMEX
```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register user & create ZMEX account |
| `POST` | `/api/auth/login` | Authenticate user & set session cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get current authenticated user profile |
| `GET` | `/api/account` | Get current account details & balance |
| `GET` | `/api/accounts/lookup/:accountNumber` | Verify beneficiary account number |
| `GET` | `/api/transactions` | Get paginated transaction history |
| `POST` | `/api/transfers` | Transfer money between accounts |
| `POST` | `/api/deposits` | Add demo funds (UPI / Debit / Credit) |

### Transfer Request Example

```http
POST /api/transfers
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "recipientAccountNumber": "ZM583920184726",
  "amount": "2500.00",
  "note": "Dinner bill"
}
```

### Demo Deposit Request Example

```http
POST /api/deposits
Content-Type: application/json
Idempotency-Key: c9bf9e57-1685-4c89-bafb-ff5af830be8a

{
  "amount": "5000.00",
  "paymentMethod": "upi"
}
```

---



## Database & Financial Design

ZMEX uses four primary tables:

```text
users  ◄── 1:1 ──►  accounts  ◄── 1:N ──►  transactions  ◄── 1:N ──►  ledger_entries
```

1. **`users`**: Stores account-holder identity (full name, email, phone) and securely hashed passwords (`bcrypt`).
2. **`accounts`**: Stores the single ZMEX account per user, containing `account_number` (`ZM...`), `balance_paise`, and timestamps.
3. **`transactions`**: Stores financial event records (`opening_balance`, `transfer`, `deposit`, `amount_paise`, `idempotency_key`, `request_fingerprint`, `note`, `payment_method`).
4. **`ledger_entries`**: Implements double-entry accounting records (`debit` / `credit`) tracking how each transaction affected specific accounts.



### Safe Money Transfers

A transfer is executed inside an atomic PostgreSQL transaction (`db.transaction`):

```text
BEGIN
   │
   ├── 1. Sort account UUIDs to prevent PostgreSQL deadlocks
   ├── 2. Lock sender + recipient accounts FOR UPDATE
   ├── 3. Re-verify sender balance under lock
   ├── 4. Atomic debit sender: UPDATE accounts SET balance_paise = balance_paise - amount
   ├── 5. Atomic credit recipient: UPDATE accounts SET balance_paise = balance_paise + amount
   ├── 6. Insert transaction record
   ├── 7. Insert debit + credit ledger entries
   │
COMMIT
```

If any step fails, PostgreSQL automatically rolls back the entire operation, guaranteeing that money is never debited without being credited.

---

## Idempotency & Rate Limiting

### Idempotency
Transfers and deposits require an `Idempotency-Key` header (`UUID v4`). This protects against double-clicks, network retries, and duplicate charges.

- **Same Key + Same Payload** ──> Returns the original transaction result without moving money again.
- **Same Key + Different Payload** ──> Returns `409 Conflict` (`IDEMPOTENCY_CONFLICT`).

Idempotency state is managed atomically inside PostgreSQL.

### Rate Limiting
Upstash Redis powers distributed sliding window rate limiting (10 transfer attempts per minute per user). If Redis is not configured or experiences a network failure, rate limiting **fails open** so legitimate transactions proceed smoothly via PostgreSQL.

---

## Authentication & Security

- Passwords are hashed with `bcrypt` (salt round 10). Plaintext passwords are never logged or stored.
- JWT session tokens are signed with `jose` (`HS256`) and stored in HttpOnly, SameSite cookies (`auth_token`).
- All protected endpoints derive the sender's account directly from the authenticated session token — clients cannot manipulate or specify a source account ID.
- Beneficiary lookup exposes only the public recipient name and masked account number — balances, emails, and phone numbers are strictly protected.

---


## Quick Test Flow

1. **Register User A**:
   - Name: Aarav Sharma
   - Email: aarav@example.com
   - Phone: 9876543210
   - Opening balance: ₹10,000.00

2. **Register User B**:
   - Name: Riya Patel
   - Email: riya@example.com
   - Phone: 9876543211
   - Opening balance: ₹2,000.00
   - *Note Riya's ZMEX Account Number (e.g. `ZM123456789012`).*

3. **Transfer Money**:
   - Log in as Aarav.
   - Go to **Transfer**, enter Riya's account number.
   - Click blur / check: Riya's name appears with a green checkmark.
   - Send ₹2,500.00.
   - **Result**: Aarav balance becomes ₹7,500.00, Riya balance becomes ₹4,500.00.

4. **Test Insufficient Balance Protection**:
   - As Aarav, attempt to transfer ₹8,000.00.
   - **Result**: Request is blocked with *"Amount exceeds your available balance"*.

5. **Test Add Money**:
   - Click **Add Money**, choose **UPI**, enter ₹5,000.00.
   - **Result**: Balance instantly updates to ₹12,500.00, and transaction history logs *"Deposit via UPI (+ ₹5,000.00)"*.

---

## Edge Cases Handled

- **Negative & Zero Amounts**: Rejected via Zod schema (`/^(0|[1-9]\d*)(\.\d{1,2})?$/`).
- **Insufficient Balance**: Blocked on frontend, service layer, and PostgreSQL atomic `WHERE balance_paise >= amount` condition.
- **Exact Balance Transfer**: Transferring exact remaining balance (e.g. ₹500 out of ₹500) is allowed and reduces balance to ₹0.00.
- **Self-Transfers**: Blocked on frontend lookup blur, beneficiary lookup API, and service layer.
- **Concurrent Overspending**: Deterministic `FOR UPDATE` row locking ensures simultaneous requests cannot double-spend the same balance.
- **Hydration Mismatches**: Date formatting uses deterministic JavaScript string formatters with `suppressHydrationWarning` to eliminate Next.js hydration warnings.

---

## Assignment Requirement Mapping

| Assignment Requirement | ZMEX Implementation |
|---|---|
| **Create user bank accounts with balance** | Multi-step registration + auto-generated `ZM...` account number & optional opening balance. |
| **View account balance** | Real-time balance display on `/dashboard`, `/transfer`, `/deposit`, and `/api/account`. |
| **View transaction history** | Paginated transaction history on `/transactions` and `/dashboard` with double-entry debit/credit tracking. |
| **Transfer money between accounts** | Secure atomic transfer flow with identity verification lookup. |
| **Prevent transfers exceeding balance** | Multi-tier validation (frontend, service layer, and PostgreSQL atomic UPDATE constraints). |
| **Show updated transaction list after transfer** | Automatic real-time state refetching and skeleton updates after every transfer or deposit. |

---

## License

This project is built for assignment demonstration purposes.
