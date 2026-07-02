/**
 * Backend money facade. The MATH lives in @campusbuddy/shared (single copy —
 * the frontend uses the same functions, so fee drift is impossible). This file
 * only binds the env-configurable brackets and re-exports the bound API so all
 * existing call sites (payments.service, specs) keep their signatures.
 */
import {
  DEFAULT_FEE_CONFIG,
  FeeConfig,
  platformFee as sharedPlatformFee,
  providerNet as sharedProviderNet,
  isValidTaskAmount as sharedIsValid,
} from '@campusbuddy/shared';

export { formatSgd } from '@campusbuddy/shared';

const cfg: FeeConfig = {
  bracket1Cents: Number(process.env.FEE_BRACKET_1_CENTS ?? DEFAULT_FEE_CONFIG.bracket1Cents),
  bracket2Cents: Number(process.env.FEE_BRACKET_2_CENTS ?? DEFAULT_FEE_CONFIG.bracket2Cents),
  rate1Bps: Number(process.env.FEE_RATE_1_BPS ?? DEFAULT_FEE_CONFIG.rate1Bps),
  rate2Bps: Number(process.env.FEE_RATE_2_BPS ?? DEFAULT_FEE_CONFIG.rate2Bps),
  rate3Bps: Number(process.env.FEE_RATE_3_BPS ?? DEFAULT_FEE_CONFIG.rate3Bps),
  minTaskCents: Number(process.env.MIN_TASK_CENTS ?? DEFAULT_FEE_CONFIG.minTaskCents),
};

export function platformFee(amountCents: number): number {
  return sharedPlatformFee(amountCents, cfg);
}

export function providerNet(amountCents: number): number {
  return sharedProviderNet(amountCents, cfg);
}

export function isValidTaskAmount(amountCents: number): boolean {
  return sharedIsValid(amountCents, cfg);
}

export const MONEY_CONFIG = cfg;
