import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Purchase } from 'expo-iap';

export const PRO_PRODUCT_ID = 'dropping_pro_lifetime';
export const DONATION_USDT_TRC20_ADDRESS = 'TDkX68D1xFkbfAJ9LoEgkb2cATdpo1TtHm';
const INSTALLATION_ID_KEY = 'dropping_installation_id';
const PURCHASE_API_URL = process.env.EXPO_PUBLIC_PURCHASE_API_URL || '';

function createInstallationId() {
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${random}`;
}

export async function getInstallationId(): Promise<string> {
  const saved = await AsyncStorage.getItem(INSTALLATION_ID_KEY);
  if (saved) return saved;
  const created = createInstallationId();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, created);
  return created;
}

export function isPurchaseVerificationConfigured() {
  return Boolean(PURCHASE_API_URL);
}

export async function verifyPurchaseWithServer(purchase: Purchase, installationId: string) {
  if (!PURCHASE_API_URL) {
    throw new Error('The purchase verification service is not configured for this build.');
  }
  const response = await fetch(`${PURCHASE_API_URL.replace(/\/$/, '')}/v1/iap/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: purchase.productId,
      store: purchase.storeId,
      purchaseToken: purchase.purchaseToken,
      transactionId: purchase.transactionId,
      installationId,
    }),
  });
  if (!response.ok) throw new Error('The store purchase could not be verified. No Pro access was granted.');
  const result = await response.json() as { entitled?: boolean; entitlementId?: string; deviceBound?: boolean };
  if (!result.entitled || !result.entitlementId || result.deviceBound !== true) {
    throw new Error('This purchase is not entitled to this installation.');
  }
  return result;
}
