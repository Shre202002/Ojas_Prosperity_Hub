import { collection } from './mongodb';

export type StoredPackage = { id: string; name: string; bv: number; description: string; active: boolean };
export type PackageView = StoredPackage & { price: number; bvRate: number; currency: string };

function roundMoney(value: number) { return Math.round(value * 100) / 100; }

export async function getActiveBvRate() {
  const current = await (await collection<any>('bv_rate')).findOne({ isActive: true });
  if (current && Number.isFinite(Number(current.rate)) && Number(current.rate) > 0) return current;
  const settings = await (await collection<any>('settings')).findOne({ _id: 'platform' });
  const legacyRate = Number(settings?.bvRate);
  if (Number.isFinite(legacyRate) && legacyRate > 0) return { rate: legacyRate, currency: 'INR', isActive: true, effectiveFrom: new Date() };
  throw new Error('No active BV rate is configured. Run the BV-rate migration or configure a rate.');
}

export function withComputedPrice(pkg: StoredPackage, rate: any): PackageView {
  const bvRate = Number(rate.rate);
  return { ...pkg, price: roundMoney(Number(pkg.bv) * bvRate), bvRate, currency: String(rate.currency || 'INR') };
}

export async function listActivePackages() {
  const rate = await getActiveBvRate();
  const items = await (await collection<StoredPackage>('packages')).find({ active: true }).sort({ bv: 1 }).toArray();
  return items.map(pkg => withComputedPrice(pkg, rate));
}

export async function getPackageConfig(id: string) {
  const pkg = await (await collection<StoredPackage>('packages')).findOne({ id, active: true });
  return pkg ? withComputedPrice(pkg, await getActiveBvRate()) : null;
}

export async function ensureDefaultPackages() { return undefined; }
