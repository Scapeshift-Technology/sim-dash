import { LedgerType, LedgerSubtype } from '../types';

// Use the URL validation logger that writes to a separate log file
const log = {
  info: (message: string, data?: any) => {
    // Use the dedicated URL validation logger if available, otherwise fallback
    if (window.electronAPI?.urlValidationLog?.info) {
      window.electronAPI.urlValidationLog.info(message, data);
    } else if (window.electronAPI?.info) {
      window.electronAPI.info(`[URL-VALIDATION] ${message}`, data);
    } else {
      console.log(`[URL-VALIDATION] ${message}`, data);
    }
  }
};

// Helper function to map URL parameters to proper case
export const mapUrlToProperCase = (urlParam: string): string => {
  const urlMappings: Record<string, string> = {
    'asset': 'Asset',
    'equity': 'Equity',
    'bankroll': 'Bankroll',
    'counterparty': 'Counterparty',
    'makeraccount': 'MakerAccount',
    'loan': 'Loan',
    'partnership': 'Partnership'
  };
  
  const mapped = urlMappings[urlParam.toLowerCase()];
  
  // Only log if mapping failed (unmapped parameter)
  if (!mapped) {
    log.info('Unknown URL parameter encountered:', { 
      urlParam, 
      lowercase: urlParam.toLowerCase(), 
      availableMappings: Object.keys(urlMappings) 
    });
  }
  
  return mapped || urlParam.charAt(0).toUpperCase() + urlParam.slice(1);
};

// Validate and convert ledger type from URL parameter
export const validateLedgerType = (type: string | undefined, pageName: string): LedgerType | null => {
  if (!type) {
    log.info(`[${pageName}] Missing type parameter`);
    return null;
  }
  
  const capitalizedType = mapUrlToProperCase(type);
  
  if (capitalizedType !== 'Asset' && capitalizedType !== 'Equity') {
    log.info(`[${pageName}] Invalid ledger type:`, { 
      originalType: type,
      capitalizedType, 
      validTypes: ['Asset', 'Equity'] 
    });
    return null;
  }
  
  return capitalizedType as LedgerType;
};

// Validate and convert ledger subtype from URL parameter
export const validateLedgerSubtype = (subtype: string | undefined, pageName: string): LedgerSubtype | null => {
  if (!subtype) {
    log.info(`[${pageName}] Missing subtype parameter`);
    return null;
  }
  
  const capitalizedSubtype = mapUrlToProperCase(subtype);
  
  const validSubtypes = ['Bankroll', 'Counterparty', 'MakerAccount', 'Loan', 'Partnership'];
  if (!validSubtypes.includes(capitalizedSubtype)) {
    log.info(`[${pageName}] Invalid ledger subtype:`, { 
      originalSubtype: subtype,
      capitalizedSubtype, 
      validSubtypes 
    });
    return null;
  }
  
  return capitalizedSubtype as LedgerSubtype;
};

// Complete validation for both type and subtype
export const validateLedgerParams = (
  type: string | undefined, 
  subtype: string | undefined, 
  pageName: string
): { ledgerType: LedgerType | null; ledgerSubtype: LedgerSubtype | null } => {
  if (!type || !subtype) {
    log.info(`[${pageName}] Missing URL parameters:`, { type, subtype });
    return { ledgerType: null, ledgerSubtype: null };
  }
  
  const capitalizedType = mapUrlToProperCase(type);
  const capitalizedSubtype = mapUrlToProperCase(subtype);
  
  if (capitalizedType !== 'Asset' && capitalizedType !== 'Equity') {
    log.info(`[${pageName}] Invalid ledger type:`, { 
      originalType: type,
      capitalizedType, 
      validTypes: ['Asset', 'Equity'] 
    });
    return { ledgerType: null, ledgerSubtype: null };
  }
  
  const validSubtypes = ['Bankroll', 'Counterparty', 'MakerAccount', 'Loan', 'Partnership'];
  if (!validSubtypes.includes(capitalizedSubtype)) {
    log.info(`[${pageName}] Invalid ledger subtype:`, { 
      originalSubtype: subtype,
      capitalizedSubtype, 
      validSubtypes 
    });
    return { ledgerType: null, ledgerSubtype: null };
  }
  
  // Happy path - no logging needed for successful validation
  return {
    ledgerType: capitalizedType as LedgerType,
    ledgerSubtype: capitalizedSubtype as LedgerSubtype,
  };
};

// Helper function to generate error info for debugging
export const generateErrorInfo = (
  type: string | undefined,
  subtype: string | undefined,
  ledgerType: LedgerType | null,
  ledgerSubtype: LedgerSubtype | null,
  config: any
) => {
  return {
    urlParams: { type, subtype },
    processedParams: { ledgerType, ledgerSubtype },
    configFound: !!config,
    timestamp: new Date().toISOString()
  };
}; 