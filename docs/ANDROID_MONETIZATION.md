# FINOVA Android monetization: setup guide

**Status: the integration is built but NOT live.** No Google Play merchant account, Play products, service account,
AdMob account or signing key exists yet. Until you finish the steps below:

- Google Play purchases are unavailable. The app says "Google Play memberships aren't switched on yet" and the server answers `503` on every Play endpoint.
- Ads use **Google's official sample ad units**, which only ever show test ads and earn nothing.
- `BILLING_TEST_MODE=false`, so nothing can activate a membership without a verified payment. Test checkout is also blocked for the Android client in every mode.

Nothing in the code simulates a successful purchase.

---

## 1. How it works

```
Android app (Capacitor shell → loads https://YOUR_DOMAIN)
  ├─ Google Play Billing (cordova-plugin-purchase)
  │    order → Google Play sheet → purchase token
  │    └─► POST /api/billing/verify/google-play   (signed-in session cookie)
  │           server → Google Play Developer API purchases.subscriptionsv2.get
  │           checks: product → plan, obfuscatedExternalAccountId == this user's tag,
  │                   token not already bound to another account
  │           → activates plan, writes invoice, acknowledges purchase
  │    app finishes the transaction only after the server accepts it
  ├─ Restore    → POST /api/billing/restore/google-play  (all tokens Play reports; each re-verified)
  ├─ Manage     → opens Google Play subscriptions (cancel / payment method / resubscribe)
  └─ AdMob      → UMP consent → SDK init → banners on allowed screens only, interstitial at natural breaks

Google Play RTDN (Pub/Sub push) → POST /api/billing/webhook/google-play?secret=…
  renewals, cancellations, grace period, on hold, pause, revocation, expiry, voided (refund) purchases
  every notification is re-verified with Google before anything changes
```

Entitlements come only from the server (`/api/auth/me` → `features`), never from the app or the device. The ad-free
flag is the same server entitlement (`features.adFree`, Pro and Elite).

| Rule from the brief | Where it's handled |
|---|---|
| Play Billing for digital purchases in the Android app | `src/lib/native/playBilling.ts`. On Android, Checkout shows only Google Play; the server rejects Razorpay/test checkout from the Android client (`X-Finova-Client: android`) |
| Verify purchases on the backend | `applyPlayPurchase()` in `server/account/routes.js` (subscriptionsv2 + account binding + acknowledge) |
| Never unlock from frontend data | Plan comes from `/api/auth/me`; gated APIs re-check on the server |
| No card details stored | Google Play takes the payment; FINOVA only receives a purchase token |
| No simulated purchases | Test mode is off, blocked on Android, and Play endpoints return 503 until configured |
| Cancellation & renewal | RTDN types 1–13 + voided purchases; cancel = access until expiry; grace = `past_due` with access; hold/pause = no access |
| No ads during paper-order placement | `OrderTicket` calls `suppressAds("paper_order")` while open; `/investments` is a no-ad route |
| Don't interrupt learning | Lessons, quizzes, masterclasses, AI tutor have no ads; the only interstitial is after a lesson is **finished** and the learner leaves it, max 3/day, ≥10 min apart, never in the first 3 min |
| Avoid misleading ads | Max content rating "General"; no rewarded "unlock premium" ads; banners never imitate FINOVA UI; block the categories in step 4.4 |
| Privacy & consent | Google UMP consent before any ad request; "Ad privacy choices" in Profile when required; analytics are anonymous daily counters |

## 2. Accounts you need (you create these; they need your identity and payment details)

1. **Google Play Console developer account** (one-time US$25): https://play.google.com/console/signup
2. **Payments profile / merchant account**: Play Console → Settings → Payments profile. Needed to sell subscriptions. Add bank account and tax info (Indian GST details if applicable).
3. **AdMob account**: https://admob.google.com. Link the same Google account and add payment info for payouts.
4. **Google Cloud project** (can reuse an existing one) for the Play Developer API service account and Pub/Sub.

## 3. Google Play Billing

### 3.1 Create the app and pick the package name
1. Play Console → **Create app** → name "FINOVA", app, free (subscriptions are in-app).
2. Choose the package name, e.g. `app.finova.android` (permanent). Put it in:
   - `.env`: `GOOGLE_PLAY_PACKAGE_NAME=app.finova.android` and `FINOVA_ANDROID_APP_ID=app.finova.android`
   - `android/app/build.gradle` → `applicationId` and `namespace` (already `app.finova.android`; change both if you pick another)
3. Upload one signed build to **Internal testing** first. Play only lets you create subscription products after an APK/AAB that includes the `BILLING` permission has been uploaded (the purchase plugin adds it).

### 3.2 Build and sign the app
```powershell
npm run android:sync      # vite build + cap sync android
npm run android:open      # opens Android Studio
```
- Install Android Studio (with Android SDK 35+). Build → **Generate Signed App Bundle** → create an upload keystore. Keep the `.jks` file and passwords **outside the repo** (git ignores `*.jks`).
- Enable **Play App Signing** when uploading (recommended).
- Before building a release, set `FINOVA_APP_URL=https://YOUR_DOMAIN` (HTTPS only) in the environment and run `npm run android:sync` so the app loads your deployed FINOVA server.

### 3.3 Create the subscriptions
Play Console → Monetize → Products → **Subscriptions**:

| Product ID | Base plan | Price | Renewal |
|---|---|---|---|
| `finova_pro` | `monthly` (auto-renewing) | ₹149, plus local prices for other countries | Monthly |
| `finova_elite` | `monthly` (auto-renewing) | ₹299, plus local prices for other countries | Monthly |

- Optional: grace period (3–7 days) and account hold are on by default. Keep them; the server handles both.
- Set `.env`: `PLAY_PRODUCT_PRO=finova_pro`, `PLAY_PRODUCT_ELITE=finova_elite`.
- Activate both base plans.

### 3.4 Service account for server verification
1. Google Cloud console → enable **Google Play Android Developer API**.
2. IAM → Service accounts → create `finova-play-verifier`. Create a **JSON key** and download it.
3. Store the JSON **outside the repo** (e.g. `C:\secrets\finova-play.json` or your host's secret store; git ignores `*service-account*.json` anyway). Set `GOOGLE_PLAY_SERVICE_ACCOUNT_FILE=C:\secrets\finova-play.json`.
4. Play Console → **Users and permissions** → Invite the service account email → app permissions for FINOVA: *View financial data* and *Manage orders and subscriptions*. Permissions can take up to 24 hours to take effect.

### 3.5 Real-time developer notifications (renewals, cancellations, refunds)
1. Generate a long random secret and set it in `.env` as `PLAY_RTDN_SECRET`. For example:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Google Cloud → Pub/Sub → create topic `finova-play-rtdn`. Grant `google-play-developer-notifications@system.gserviceaccount.com` the **Pub/Sub Publisher** role on the topic.
3. Create a **push** subscription on the topic. Endpoint: `https://YOUR_DOMAIN/api/billing/webhook/google-play?secret=<PLAY_RTDN_SECRET>`.
4. Play Console → Monetize → Monetization setup → **Real-time developer notifications** → topic `projects/<project>/topics/finova-play-rtdn` → "Send test notification". The server answers 200 and ignores it (test notifications carry no purchase).
5. Also enable **voided purchase** notifications if your console shows the option (refunds and chargebacks revoke access).

### 3.6 Test purchases (real Play flow, no charge)
1. Play Console → Settings → **License testing** → add the Gmail accounts of testers. Their purchases are free, renew every few minutes, and the server records them with `test: true` (shown as "Test, not charged").
2. Install the app from the Internal testing track (opt-in link) on a device signed in with a tester account.
3. Check: buy Pro → server activates Pro (Account page shows "Paid via Google Play"); upgrade to Elite (replaces the Pro subscription with proration); cancel in Google Play → "Ends on …"; let it expire → back to Free; "Restore Google Play purchases" on a fresh install.
4. A purchase on the wrong FINOVA account is refused (403): the token carries the purchaser's account tag.

## 4. AdMob

### 4.1 Create the app and ad units
1. AdMob → Apps → **Add app** → Android → link to the Play listing once published (you can add it unpublished first).
2. Copy the **App ID** (`ca-app-pub-XXXXXXXX~YYYYYYYY`) into `android/gradle.properties`:
   ```
   ADMOB_APP_ID=ca-app-pub-XXXXXXXX~YYYYYYYY
   ```
   Without it the manifest uses Google's sample app id (test ads only).
3. Create ad units: **Banner** (adaptive) and **Interstitial**. Put them in the build environment:
   ```
   VITE_ADMOB_BANNER_ID=ca-app-pub-XXXXXXXX/1111111111
   VITE_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXX/2222222222
   VITE_ADMOB_TESTING=false     # only for the release build
   ```
   Then `npm run android:sync`. While developing keep `VITE_ADMOB_TESTING=true` and add your device's test id (printed in logcat) to `VITE_ADMOB_TEST_DEVICE_IDS`. **Never tap live ads on your own devices**; AdMob can suspend the account for it.

### 4.2 Consent (GDPR / US state privacy)
1. AdMob → Privacy & messaging → **GDPR** → create a message for the FINOVA app (choose your ad partners; link your privacy policy). Repeat for **US state regulations** messages.
2. The app already calls Google UMP before initialising ads, shows the form when required, and requests no ads when consent can't be obtained. When privacy options apply, Profile shows **Ad privacy choices** so users can change their decision.
3. Test from outside the EEA with UMP debug geography by adding your test device id; reset consent by clearing app data.

### 4.3 app-ads.txt
Host `https://YOUR_DOMAIN/app-ads.txt` with the line AdMob shows under Apps → app-ads.txt (`google.com, pub-XXXXXXXX, DIRECT, f08c47fec0942fa0`). Put the same domain in the Play listing's developer website. You can place the file in `public/app-ads.txt` so Vite serves it.

### 4.4 Ad quality & policy settings (AdMob → Blocking controls)
- Block sensitive categories: **Gambling & betting, Get-rich-quick, Cryptocurrency/trading signals, Dating, Drugs & supplements**, and "Personal loans" if you want to avoid predatory lending ads near a finance-learning audience.
- Max ad content rating: **G** (the app also requests "General").
- Don't place ads near buttons. The banner sits above FINOVA's bottom navigation (64 dp margin). Never add rewarded ads that unlock paid features.

## 5. Google Play policy checklist

- **Data safety form:** declare email (account), purchase history (subscriptions via Google Play), app interactions (anonymous analytics), device or other IDs (advertising ID via AdMob), and approximate location (AdMob). Data is encrypted in transit; users can request deletion (provide a contact).
- **Ads declaration:** "Yes, my app contains ads."
- **Target audience:** 18+ (financial education with paper trading). Do not target children; the app sets `tagForChildDirectedTreatment=false`.
- **Financial features declaration:** FINOVA offers education and **paper trading only** (no real trading, lending or payments). State this in the declaration and listing.
- **Subscriptions:** the listing and in-app pricing must show price, billing period and how to cancel (Checkout and Account pages do this). Cancellation is in Google Play.
- **Privacy policy URL** (required for ads and accounts): publish one on your domain covering accounts, payments via Google Play/Razorpay, AdMob, and analytics.

## 6. Server environment summary

| Variable | Purpose |
|---|---|
| `BILLING_TEST_MODE=false` | Must stay false in production |
| `GOOGLE_PLAY_PACKAGE_NAME` | Play package name |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_FILE` | Path to service-account JSON (outside repo) |
| `PLAY_PRODUCT_PRO` / `PLAY_PRODUCT_ELITE` | Subscription product IDs |
| `PLAY_RTDN_SECRET` | Shared secret in the RTDN push URL |
| `ADMIN_EMAILS` | Accounts allowed to open `/admin/metrics` |

## 7. Revenue & conversion analytics

`/admin/metrics` (admins only, via `ADMIN_EMAILS`) shows:
- **MRR** and active paid members by plan and provider, from server-verified subscriptions (test purchases excluded)
- **Verified revenue** from invoices (gross; Google's 15% service fee and taxes not deducted)
- **Funnel:** sign-ups → pricing views → paywall views → checkout views → checkout starts → new paid members, plus upgrades, cancellations, expirations and restores
- **Ads:** impressions and the AdMob SDK's estimated paid-event revenue. Use the AdMob console for real earnings.

Client analytics are anonymous: whitelisted event names, aggregated into daily counters by platform and one dimension (plan, placement…). No user ids or IP addresses are stored with them.

## 8. Going live checklist

- [ ] Play Console app, merchant profile, subscriptions `finova_pro` and `finova_elite` active
- [ ] Service account invited with financial + orders permissions; `.env` Play variables set; server restarted
- [ ] RTDN topic and push subscription pointing at `/api/billing/webhook/google-play?secret=…`; test notification returns 200
- [ ] License-tester purchase, upgrade, cancel, expiry and restore all verified
- [ ] AdMob app + units created; `ADMOB_APP_ID` in gradle.properties; `VITE_ADMOB_*` set; `VITE_ADMOB_TESTING=false` only in the release build
- [ ] GDPR + US-state consent messages published; app-ads.txt live
- [ ] Data safety, ads declaration, target audience, financial features and privacy policy completed
- [ ] `FINOVA_APP_URL` points at the HTTPS production site; signed AAB uploaded to internal → closed → production
