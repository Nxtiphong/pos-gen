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

## Deploy to Vercel

Nothing in this section runs automatically. Every command targets the real Firebase project, so pass its id explicitly (`.firebaserc` defaults to the demo emulator project).

### Environment variables in Vercel

Set these in Vercel > Project > Settings > Environment Variables (names only; values come from the Firebase console):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (the PEM on one line with literal `\n` between lines)

Leave `NEXT_PUBLIC_USE_EMULATORS`, `NEXT_PUBLIC_EMULATOR_HOST`, `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST` unset in Vercel. `SEED_STAFF_PASSWORD` is only for the seed command below, not for Vercel.

### Firebase console

1. Authentication > Sign-in method: enable Email/Password.
2. Storage > Get started: create the project's default bucket. Product images go to `products/{productId}/{filename}` in that bucket, and `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` must name it.
3. Create the staff account and its `staff: true` claim from your machine, with the server variables in `.env.local`:

   ```bash
   npm run seed:prod
   ```

   It reads `.env.local` (never `.env.development.local`), refuses to run if an emulator host is set, and asks for the staff password twice without echoing it. It writes the seed catalog only when `products` is empty, so rerunning it just resets the staff password and keeps the claim.
4. Authentication > Settings > User actions: turn off "Enable create (sign-up)". The rules already deny accounts without the `staff` claim, so this is defense in depth, not the only guard.
5. Deploy the rules, indexes and storage rules with the Firebase CLI:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage --project <your-project-id>
   ```

Then deploy the app from Vercel (Git push or `vercel --prod`).
