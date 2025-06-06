import { PeriodTypeCode, PeriodKey, Period } from "@/types/statCaptureConfig";

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

        if (periodTypeCode === 'I' && periodNumber === 99) {
            return 'I1-3';
        }

        return `${periodTypeCode}${periodNumber}`;
    }
}

function displayPeriodToCodeAndNumber(displayPeriod: string): { periodTypeCode: PeriodTypeCode, periodNumber: number } {
    if (displayPeriod === 'FG') {
        return { periodTypeCode: 'M', periodNumber: 0 };
    } else if (displayPeriod === 'I1-3') {
        return { periodTypeCode: 'I', periodNumber: 99 };
    } else {
        const periodTypeCode = displayPeriod[0] as PeriodTypeCode;
        const periodNumber = parseInt(displayPeriod.slice(1));
        return { periodTypeCode, periodNumber };
    }
}

function getPeriodLabel(period: Period): string {
    if (period.PeriodTypeCode.trim() === 'M' && period.PeriodNumber === 0) {
        return 'Full Game';
    }
    
    // Handle special MLB periods
    if (period.PeriodTypeCode === 'I' && period.PeriodNumber === 99) {
        return period.PeriodName; // Returns "Innings 1-3"
    }
    
    return `${period.PeriodName} ${period.PeriodNumber}`;
}

export { getPeriodKey, periodKeyToCodeAndNumber, periodKeyToDisplayPeriod, displayPeriodToCodeAndNumber, getPeriodLabel }