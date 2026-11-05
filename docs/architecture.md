# Architecture

Next.js 15 App Router on Vercel. Firestore is the database and the realtime channel. One shop, one staff account.

## Actors

- **Staff iPad.** Signs in with Firebase Auth (email/password, one account). Reads and writes Firestore directly with the client SDK.
- **Customer phone.** Not signed in. Opens `/b/{publicToken}` from the QR. Subscribes to `bills/{publicToken}` and `queues/{businessDate}` with `onSnapshot`. Never reads `orders`.
- **Route handler `POST /api/bills/{token}/scan`.** Runs firebase-admin on the Node runtime. Sets `scannedAt` on the bill and its order only when it is still absent, so repeated opens are harmless.

## Collections

| Path | Fields | Who reads | Who writes |
|---|---|---|---|
| `categories/{id}` | name, sortOrder | staff, customer never | staff |
| `products/{id}` | name, price (integer baht), unit, categoryId, imageUrl?, isAvailable, sortOrder | staff | staff |
| `counters/{businessDate}` | next (int) | staff | staff, in the create-order transaction |
| `orders/{id}` | orderNo, businessDate, publicToken, lines[], itemCount, total, cashReceived, change, status, createdAt, scannedAt?, notifiedAt?, notifyCount, pickedUpAt? | staff | staff; admin for scannedAt |
| `bills/{publicToken}` | orderId, orderNo, businessDate, lines[], total, cashReceived, change, status, createdAt, notifiedAt?, notifyCount, scannedAt? | anyone by exact id (`get`, never `list`) | staff; admin for scannedAt |
| `queues/{businessDate}` | preparing: orderNo[] in creation order | anyone by exact id | staff |

`lines[]` items are `{ productId, name, price, qty }`, snapshots taken at sale time.

`status` is `preparing | notified | picked_up`. Transitions: `preparing → notified` (notify), `notified → notified` (re-notify, notifyCount + 1), `notified → picked_up`. Each transition writes the order, its bill, and the queue doc in one batch.

`businessDate` is `YYYY-MM-DD` in Asia/Bangkok. `orderNo` is `A` + counter zero-padded to 3 digits. The counter doc per date makes numbering restart daily.

`publicToken` is 22+ chars of URL-safe randomness from `crypto.getRandomValues`. The bill URL never contains the order number.

## Realtime notify

The customer page rings when `bill.notifyCount` rises above the last value it saw (first snapshot only sets the baseline unless status is already `notified`). Ringing means three signals together: full-screen green, a Web Audio beep pattern (unlocked by the "เปิดเสียงแจ้งเตือน" tap), and `navigator.vibrate` where supported.

## Local development

`npm run emulators` starts the Auth, Firestore and Storage emulators (needs `/opt/homebrew/opt/openjdk/bin` on PATH). With `NEXT_PUBLIC_USE_EMULATORS=1` the client SDK connects to them, and the admin SDK follows `FIRESTORE_EMULATOR_HOST`. `npm run seed` writes the seed catalog and the staff user to whichever target the env points at.
