import { PeriodTypeCode, PeriodKey } from "@/types/statCaptureConfig";

// ---------- Main function ----------

function getPeriodCode(periodTypeCode: PeriodTypeCode, periodNumber: number): PeriodKey {
    if (periodTypeCode === 'M') {
        return 'fullGame';
    } else if (periodTypeCode === 'H' && periodNumber === 1) {
        return 'firstFive';
    } else {
        return `${periodTypeCode}${periodNumber}`;
    }
}

export { getPeriodCode }