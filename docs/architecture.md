# Architecture

Next.js 15 App Router on Vercel. Firestore is the database and the realtime channel. One shop, one staff account.

## Actors

- **Staff iPad.** Signs in with Firebase Auth (email/password, one account). Reads and writes Firestore and Storage directly with the client SDK. Staff means the custom claim `staff: true` on the ID token, which only `npm run seed` sets (through firebase-admin). `firestore.rules` and `storage.rules` both define `isStaff()` as `request.auth != null && request.auth.token.staff == true`, so an account anyone creates with the public web API key gets customer access and nothing more. After sign-in the client reads the token claims and forces one token refresh if `staff` is missing, so a session that predates the claim picks it up; an account still without the claim is signed out. Turning off public sign-up in the Firebase console is defense in depth on top of the claim, not the guard itself.
- **Customer phone.** Not signed in. Opens `/b/{publicToken}` from the QR. Subscribes to `bills/{publicToken}` and `queues/{businessDate}` with `onSnapshot`. Never reads `orders`.
- **Route handler `POST /api/bills/{token}/scan`.** Runs firebase-admin on the Node runtime. Sets `scannedAt` on the bill and its order only when it is still absent, so repeated opens are harmless.

## Collections

| Path | Fields | Who reads | Who writes |
|---|---|---|---|
| `categories/{id}` | name, sortOrder | staff, customer never | staff |
| `products/{id}` | name, price (integer baht), unit, categoryId, imageUrl? (Storage download URL of `products/{id}/{filename}`), isAvailable, sortOrder | staff | staff |
| `counters/{businessDate}` | next (int) | staff | staff, in the create-order transaction |
| `orders/{id}` | orderNo, businessDate, publicToken, lines[], itemCount, total, cashReceived, change, status, createdAt, scannedAt?, notifiedAt?, notifyCount, pickedUpAt? | staff | staff; admin for scannedAt |
| `bills/{publicToken}` | orderId, orderNo, businessDate, lines[], total, cashReceived, change, status, createdAt, notifiedAt?, notifyCount, scannedAt? | anyone by exact id (`get`, never `list`) | staff; admin for scannedAt |
| `queues/{businessDate}` | preparing: orderNo[] in creation order | anyone by exact id | staff |

`lines[]` items are `{ productId, name, price, qty }`, snapshots taken at sale time.

`status` is `preparing | notified | picked_up`. Transitions: `preparing → notified` (notify), `notified → notified` (re-notify, notifyCount + 1), `notified → picked_up`. Each transition writes the order, its bill, and the queue doc in one batch.

Creating an order is one transaction: read `orders/{id}`, read the counter, then write the counter, the order, the bill and the queue. The checkout generates the order id once per attempt and reuses it when staff press ชำระเสร็จ again after an error, so if a commit succeeded but its response was lost, the retry finds the order and returns it without taking another number.

`businessDate` is `YYYY-MM-DD` in Asia/Bangkok. `orderNo` is `A` + counter zero-padded to 3 digits. The counter doc per date makes numbering restart daily.

`publicToken` is 22+ chars of URL-safe randomness from `crypto.getRandomValues`. The bill URL never contains the order number.

## Realtime notify

The customer page rings when `bill.notifyCount` rises above the last value it saw (first snapshot only sets the baseline unless status is already `notified`). Ringing means three signals together: full-screen green, a Web Audio beep pattern (unlocked by the "เปิดเสียงแจ้งเตือน" tap), and `navigator.vibrate` where supported.

## Local development

`npm run emulators` starts the Auth (9099), Firestore (8180) and Storage (9199) emulators for project `demo-pos-gen` (the script prepends `/opt/homebrew/opt/openjdk/bin` to PATH). Ports live in `firebase.json`, which the client SDK reads. With `NEXT_PUBLIC_USE_EMULATORS=1` the client SDK connects to them, and the admin SDK follows `FIRESTORE_EMULATOR_HOST`. `npm run seed` writes the seed catalog and the staff user to whichever target the env points at.
