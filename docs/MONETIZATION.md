# DropPing monetization contract

## Pro product

DropPing Pro is a **non-consumable lifetime in-app purchase**. It is not a subscription and it is not unlocked by a local flag or a cryptocurrency transfer.

Create the same product in both stores:

- Product ID: `dropping_pro_lifetime`
- Type: non-consumable / one-time product
- Base price: USD 2.99
- Display price: supplied by Google Play or App Store for the user's storefront

The app must not add a fake tax line. Storefronts calculate and collect applicable tax and local-currency amounts. A user may therefore see a total that differs from the USD base price.

## Client flow

The Settings Pro card uses `expo-iap` and works only in a development build or store build, not Expo Go:

1. Fetch the product from the current store.
2. Start the native purchase flow.
3. Send the store, product ID, purchase token, transaction ID, and installation binding to the verification API.
4. Unlock Pro only when the API returns `entitled: true`, a non-empty `entitlementId`, and `deviceBound: true`.
5. Finish/acknowledge the store transaction only after successful verification.
6. Restore store purchases through the same verification path.

The client never treats a locally edited `isPro` value as proof of purchase. The server response is authoritative.

## Verification API

The client expects:

```text
POST {EXPO_PUBLIC_PURCHASE_API_URL}/v1/iap/verify
Content-Type: application/json
```

Request body:

```json
{
  "productId": "dropping_pro_lifetime",
  "store": "play or apple",
  "purchaseToken": "sensitive store token",
  "transactionId": "store transaction identifier",
  "installationId": "stable random ID stored on this installation"
}
```

Success response:

```json
{
  "entitled": true,
  "entitlementId": "server-generated entitlement ID",
  "deviceBound": true
}
```

The server must:

- Verify Google purchases with the Google Play Developer API.
- Verify Apple transactions with the App Store Server API.
- Confirm the package/bundle ID and exact product ID.
- Reject pending, refunded, revoked, duplicate, or invalid transactions.
- Bind the first verified entitlement to one installation record.
- Never log or expose purchase tokens.
- Provide an authenticated support process for legitimate device replacement; do not silently allow unlimited device rebinding.
- Treat store refund/revocation notifications as entitlement-revoking events.

A strict one-device rule cannot be reliably enforced by the mobile app alone. It requires this server-side binding and store-side verification.

## Donations

Donations are separate from Pro and never change entitlement state. The current optional donation address is:

```text
USDT on TRON (TRC20): TDkX68D1xFkbfAJ9LoEgkb2cATdpo1TtHm
```

The app describes a suggested minimum of the equivalent of USD 1, but it does not perform currency conversion or claim that a transfer was received. The sender must verify the TRC20 network and address before sending. Local-currency donations require a separate compliant donation/payment provider and must not be presented as an alternative way to unlock Pro.

## Release prerequisites

Before production purchase testing:

1. Create the Google Play one-time product and App Store non-consumable product.
2. Deploy the verification API and set `EXPO_PUBLIC_PURCHASE_API_URL` in the EAS build environment.
3. Add Google service-account access for Play purchase verification and Apple App Store Server API credentials on the server only.
4. Test pending, successful, duplicate, restore, refund, revoked, and device-replacement cases with store sandbox/test tracks.
5. Build a development client or store build; Expo Go cannot load native IAP modules.
