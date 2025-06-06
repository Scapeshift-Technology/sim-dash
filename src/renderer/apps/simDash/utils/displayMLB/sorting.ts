import { displayPeriodToCodeAndNumber } from "@@/services/statCaptureConfig/utils";

// ---------- Helper functions ----------

function getPeriodSortOrder(displayPeriod: string): number {
  if (displayPeriod === 'FG') return 0;
    
  const { periodTypeCode, periodNumber } = displayPeriodToCodeAndNumber(displayPeriod);
    
  if (periodTypeCode === 'H') return 1000 + periodNumber; // Big numbers to give space for codes(like I99)
  if (periodTypeCode === 'I') return 2000 + periodNumber;
    
  return 9999; // fallback
};

export { getPeriodSortOrder };