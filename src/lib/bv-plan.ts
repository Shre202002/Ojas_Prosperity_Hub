// Shared by client and server so the BV rules cannot drift. A plan is filled when cart BV is in [plan.bv - BV_TOLERANCE, plan.bv].
export const BV_TOLERANCE = 10;

type PlanBv = { bv: number };

export const isPlanFilled = (plan: PlanBv, totalBv: number) => totalBv <= plan.bv && totalBv >= plan.bv - BV_TOLERANCE;
export const bvLeft = (plan: PlanBv, totalBv: number) => plan.bv - totalBv;
export const canAddBv = (plan: PlanBv, totalBv: number, productBv: number) => totalBv + productBv <= plan.bv;
export const planMatch = <T extends PlanBv>(totalBv: number, plans: T[]) => plans.find((p) => isPlanFilled(p, totalBv)) ?? null;
