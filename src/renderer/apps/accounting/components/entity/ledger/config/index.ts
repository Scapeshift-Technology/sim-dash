import { LedgerTypeConfig, LedgerType, LedgerSubtype, AssetSubtype, EquitySubtype, getLedgerKey } from '../types';
import { assetBankrollConfig } from './asset-bankroll';
import { assetCounterpartyConfig } from './asset-counterparty';
import { assetMakerAccountConfig } from './asset-makeraccount';
import { equityLoanConfig } from './equity-loan';
import { equityPartnershipConfig } from './equity-partnership';

// Map of all configurations
export const ledgerTypeConfigs: Record<string, LedgerTypeConfig> = {
  'Asset_Bankroll': assetBankrollConfig,
  'Asset_Counterparty': assetCounterpartyConfig,
  'Asset_MakerAccount': assetMakerAccountConfig,
  'Equity_Loan': equityLoanConfig,
  'Equity_Partnership': equityPartnershipConfig,
  // TODO: Add other configs as they are implemented
  // 'Asset_Counterparty': assetCounterpartyConfig,
  // 'Asset_MakerAccount': assetMakerAccountConfig,
  // 'Equity_Loan': equityLoanConfig,
};

// Helper functions to get configurations
export function getLedgerTypeConfig(type: LedgerType, subtype: LedgerSubtype): LedgerTypeConfig | undefined {
  const key = `${type}_${subtype}`;
  console.log('[Config] Looking up ledger configuration:', { 
    type, 
    subtype, 
    key, 
    availableKeys: Object.keys(ledgerTypeConfigs),
    configExists: !!ledgerTypeConfigs[key]
  });
  
  const config = ledgerTypeConfigs[key];
  if (!config) {
    console.log('[Config] No configuration found for key:', key);
  }
  
  return config;
}

export function getAssetSubtypes(): AssetSubtype[] {
  return ['Bankroll', 'Counterparty', 'MakerAccount'];
}

export function getEquitySubtypes(): EquitySubtype[] {
  return ['Loan', 'Partnership'];
}

export function getSubtypesForType(type: LedgerType): LedgerSubtype[] {
  if (type === 'Asset') {
    return getAssetSubtypes();
  } else {
    return getEquitySubtypes();
  }
}

export function getImplementedSubtypes(type: LedgerType): LedgerSubtype[] {
  const allSubtypes = getSubtypesForType(type);
  return allSubtypes.filter(subtype => {
    const key = `${type}_${subtype}`;
    return ledgerTypeConfigs[key] !== undefined;
  });
}

export function getAllImplementedConfigs(): LedgerTypeConfig[] {
  return Object.values(ledgerTypeConfigs);
}

// Re-export utility functions
export { getLedgerKey } from '../types';

// Re-export individual configs
export { assetBankrollConfig } from './asset-bankroll';
export { assetCounterpartyConfig } from './asset-counterparty';
export { assetMakerAccountConfig } from './asset-makeraccount';
export { equityLoanConfig } from './equity-loan';
export { equityPartnershipConfig } from './equity-partnership'; 