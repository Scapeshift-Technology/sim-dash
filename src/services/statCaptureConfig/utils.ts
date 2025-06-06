import { PeriodTypeCode, PeriodKey } from "@/types/statCaptureConfig";

// ---------- Main function ----------

function getPeriodKey(periodTypeCode: PeriodTypeCode, periodNumber: number): PeriodKey {
    if (periodTypeCode === 'M') {
        return 'fullGame';
    } else if (periodTypeCode === 'H' && periodNumber === 1) {
        return 'firstFive';
    } else {
        return `${periodTypeCode}${periodNumber}`;
    }
}

function periodKeyToCodeAndNumber(periodKey: PeriodKey): { periodTypeCode: PeriodTypeCode, periodNumber: number } {
    if (periodKey === 'fullGame') {
        return { periodTypeCode: 'M', periodNumber: 0 };
    } else if (periodKey === 'firstFive') {
        return { periodTypeCode: 'H', periodNumber: 1 };
    } else {
        const periodTypeCode = periodKey[0] as PeriodTypeCode;
        const periodNumber = parseInt(periodKey.slice(1));
        return { periodTypeCode, periodNumber };
    }
}

function periodKeyToDisplayPeriod(periodKey: PeriodKey): string {
    if (periodKey === 'fullGame') {
        return 'FG';
    } else {
        const { periodTypeCode, periodNumber } = periodKeyToCodeAndNumber(periodKey);
        return `${periodTypeCode}${periodNumber}`;
    }
}

export { getPeriodKey, periodKeyToCodeAndNumber, periodKeyToDisplayPeriod }