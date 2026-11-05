# POS ร้านในตลาด

iPad point of sale for a market stall. Next.js 15 App Router, Firebase (Auth + Firestore), deployed on Vercel. See `docs/architecture.md` for the data model.

## Local development on the emulators

Local runs use the Firebase Emulator Suite with the project id `demo-pos-gen`. The `demo-` prefix means the SDKs can never reach a real project.

1. Create `.env.development.local` (gitignored, loaded by `next dev` and `npm run seed`):

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=demo-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=demo-pos-gen.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-pos-gen
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-pos-gen.appspot.com
   NEXT_PUBLIC_USE_EMULATORS=1
   FIREBASE_PROJECT_ID=demo-pos-gen
   FIRESTORE_EMULATOR_HOST=127.0.0.1:8180
   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
   ```

2. Start the emulators (Java on PATH; the script prepends `/opt/homebrew/opt/openjdk/bin`):

   ```bash
   npm run emulators
   ```

3. In another terminal, seed the catalog and the staff user `staff@pos.local` with the custom claim `staff: true` (password `SEED_STAFF_PASSWORD`, default `changeme123` on the emulators only). Rerunning it is safe:

   ```bash
   npm run seed
   ```

4. Run the app and sign in at `/login`:

   ```bash
   npm run dev
   ```

Emulator data is in memory and is lost when the emulators stop. Rerun `npm run seed` after each start.

## Checks

```bash
npm run typecheck
npm run lint
npm test            # domain unit tests
npm run test:rules  # firestore.rules, storage.rules and createOrder against the emulators
npm run build
```

## Production

Copy `.env.example` into the Vercel project settings and fill in the web app config and a service account. Leave `NEXT_PUBLIC_USE_EMULATORS`, `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` unset. In the Firebase console, turn off sign-up (Authentication > Settings > User actions > Enable create) after creating the staff account. The rules only grant staff access to accounts with the `staff: true` custom claim that `npm run seed` sets, so this is defense in depth.
