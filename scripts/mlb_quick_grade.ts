#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import chat-bet-parse package
import { parseChat, ChatBetGradingClient, type ParseResult, type ChatFillResult, type ChatOrderResult } from 'chat-bet-parse';

// Type Definitions for our internal processing
export interface ProcessedBet {
    rawInput: string;
    executionDtm: Date;
    parseResult?: ParseResult;
    parseError?: string;
    price?: number;
    size?: number;
}

// --- BEGIN SUMMARY HELPER FUNCTIONS ---

function formatDateForSummary(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
}

function formatPnlForSummary(pnl: number): string {
    // Format to 2 decimal places first
    const pnlWithPennies = parseFloat(pnl.toFixed(2)); // Ensures we're working with a number rounded to 2 decimal places

    const sign = pnlWithPennies >= 0 ? '+' : '-';
    
    // Get the absolute value, format with commas and 2 decimal places for consistency
    const absPnlStr = Math.abs(pnlWithPennies).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }); // e.g., "5,230.75", "300.10", "0.00"

    const parts = absPnlStr.split('.');
    const integerPart = parts[0]; // e.g., "5,230", "300", "0"
    const decimalPart = parts[1]; // e.g., "75", "10", "00"

    // Pad the integer part to maintain alignment similar to the original examples
    const paddedIntegerPart = integerPart.padStart(5, ' '); 
    
    return `${sign}$${paddedIntegerPart}.${decimalPart}`;
}

function getMonday(d: Date): Date {
    const date = new Date(d.valueOf()); // Clone date
    const dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
    // Calculate days to subtract to get to the most recent Monday
    // Sunday (0) -> subtract 6, Monday (1) -> subtract 0, Tuesday (2) -> subtract 1, etc.
    const daysToSubtract = (dayOfWeek + 6) % 7;
    date.setDate(date.getDate() - daysToSubtract);
    return date;
}

function printDailySummary(pnlSummariesData: { date: Date, pnl: number }[]) {
    if (pnlSummariesData.length === 0) return;

    console.log("\n--- DAILIES ---");
    const dailyTotals: Map<string, number> = new Map();

    for (const item of pnlSummariesData) {
        const dateKey = item.date.toISOString().split('T')[0]; // YYYY-MM-DD for sorting and grouping
        dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + item.pnl);
    }

    const sortedDays = Array.from(dailyTotals.keys()).sort();

    for (const dateKey of sortedDays) {
        const pnl = dailyTotals.get(dateKey)!;
        // Create a new Date object from YYYY-MM-DD to ensure correct local date formatting
        const parts = dateKey.split('-').map(Number);
        const displayDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        console.log(`${formatDateForSummary(displayDateObj)}, ${formatPnlForSummary(pnl)}`);
    }
}

function printWeeklySummary(pnlSummariesData: { date: Date, pnl: number }[]) {
    if (pnlSummariesData.length === 0) return;

    console.log("\n--- WEEKLIES (Monday thru Sunday) ---");
    const weeklyTotals: Map<string, number> = new Map(); // Key is Monday's YYYY-MM-DD

    for (const item of pnlSummariesData) {
        const monday = getMonday(item.date);
        // Use local date formatting instead of toISOString() to avoid timezone issues
        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const day = String(monday.getDate()).padStart(2, '0');
        const mondayKey = `${year}-${month}-${day}`;
        weeklyTotals.set(mondayKey, (weeklyTotals.get(mondayKey) || 0) + item.pnl);
    }

    const sortedMondays = Array.from(weeklyTotals.keys()).sort();

    for (const mondayKey of sortedMondays) {
        const pnl = weeklyTotals.get(mondayKey)!;
        const parts = mondayKey.split('-').map(Number);
        const mondayDate = new Date(parts[0], parts[1] - 1, parts[2]);
        
        const sundayDate = new Date(mondayDate);
        sundayDate.setDate(mondayDate.getDate() + 6);

        const dateRangeStr = `${formatDateForSummary(mondayDate)} - ${formatDateForSummary(sundayDate)}`;
        console.log(`${dateRangeStr}, ${formatPnlForSummary(pnl)}`);
    }
}

function printTotalSummary(pnlSummariesData: { date: Date, pnl: number }[]) {
    if (pnlSummariesData.length === 0) {
      // Print total as $0 if no PNL data, to match example structure if sections are always shown
      console.log("\n--- TOTAL: +$    0.00 ---");
      return;
    }
    const totalPnl = pnlSummariesData.reduce((sum, item) => sum + item.pnl, 0);
    console.log(`\n--- TOTAL: ${formatPnlForSummary(totalPnl)} ---`);
}

// --- END SUMMARY HELPER FUNCTIONS ---

// --- BEGIN NEW HELPER FUNCTION for Risk/ToWin ---

export function calculateRiskAndToWin(price: number, betSize: number): { risk: number; toWin: number } | null {
    let risk: number;
    let toWin: number;

    if (price >= 100) {
        risk = betSize;
        toWin = betSize * (price / 100);
    } else if (price <= -100) {
        // For negative odds, 'betSize' is the 'toWin' amount.
        // Risk = ToWin / (100 / abs(Price)) = ToWin * (abs(Price) / 100)
        toWin = betSize;
        risk = betSize * (Math.abs(price) / 100);
    } else {
        // Price is not in the specified ranges (e.g. -99 to 99, excluding 0, or 0 itself).
        // The user's definition of 'betSize' interpretation doesn't apply.
        console.warn(`[calculateRiskAndToWin WARN] Price ${price} is not >= 100 or <= -100. Cannot determine Risk/ToWin based on standard American odds interpretation of Size.`);
        return null;
    }
    // Round to 4 decimal places to avoid floating point inaccuracies
    risk = parseFloat(risk.toFixed(4));
    toWin = parseFloat(toWin.toFixed(4));

    return { risk, toWin };
}

// --- END NEW HELPER FUNCTION for Risk/ToWin ---

// --- BEGIN CONCURRENCY LIMITER ---

async function processWithConcurrencyLimit<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number = 50
): Promise<R[]> {
    const results: R[] = [];
    console.log(`Processing ${items.length} bets with max concurrency of ${maxConcurrency}, dtm = ${new Date().toISOString()}`);
    // Process items in batches
    for (let i = 0; i < items.length; i += maxConcurrency) {
        const batch = items.slice(i, i + maxConcurrency);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
        console.log(`Processed ${i + maxConcurrency} of ${items.length} bets, dtm = ${new Date().toISOString()}`);
    }
    
    return results;
}

// --- END CONCURRENCY LIMITER ---

// --- BEGIN NEW PARSING LOGIC WITH CHAT-BET-PARSE ---

export function parseBetDetailsWithChatBetParse(dateOnlyStr: string, timeOnlyStr: string, rawDetailsYg: string): ProcessedBet | null {
    try {
        // Create date in local timezone
        const localDate = new Date(`${dateOnlyStr} ${timeOnlyStr}`);
        if (isNaN(localDate.getTime())) {
            console.warn(`[DetailParse WARN] Invalid date/time for ExecutionDtm: ${dateOnlyStr} ${timeOnlyStr} from line part: ${rawDetailsYg}`);
            return null;
        }
        const executionDtm = localDate;

        const fullRawInput = `${dateOnlyStr}, ${timeOnlyStr}, ${rawDetailsYg}`;

        try {
            // Use chat-bet-parse to parse the contract details
            const parseResult = parseChat(rawDetailsYg);
            
            // Extract price and size from the parse result
            const price = parseResult.bet.Price;
            const size = parseResult.bet.Size;

            return {
                rawInput: fullRawInput,
                executionDtm: executionDtm,
                parseResult: parseResult,
                price: price,
                size: size
            };

        } catch (error) {
            // If parsing fails, capture the error
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            return {
                rawInput: fullRawInput,
                executionDtm: executionDtm,
                parseError: errorMessage
            };
        }

    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[DetailParse ERROR] Failed parsing details for "${rawDetailsYg}": ${message}`);
        return null;
    }
}

// --- END NEW PARSING LOGIC ---

function printTable(headers: string[], rows: (string | number | Date | undefined)[][]) {
    if (rows.length === 0) {
        console.log("No valid lines to display.");
        return;
    }

    const columnWidths = headers.map((header, index) => {
        const maxLength = Math.max(
            header.length,
            ...rows.map(row => String(row[index] !== undefined ? row[index] : '').length)
        );
        return maxLength;
    });

    const headerLine = headers.map((header, index) => header.padEnd(columnWidths[index])).join(' | ');
    const separatorLine = columnWidths.map(width => '-'.repeat(width)).join('-|-');

    console.log(headerLine);
    console.log(separatorLine);

    rows.forEach(row => {
        const rowLine = row.map((cell, index) => String(cell !== undefined ? cell : '').padEnd(columnWidths[index])).join(' | ');
        console.log(rowLine);
    });
}

export function validateLine(line: string): { date: string; time: string; details: string } | null {
    const parts = line.split(',').map(part => part.trim());
    if (parts.length !== 3) {
        return null;
    }

    const [dateStr, timeStr, detailsStr] = parts;

    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    const timeRegex = /^\d{1,2}:\d{2} [AP]M$/;
    const detailsRegex = /^(YG|IW)/; // Accept both YG (fills) and IW (orders)

    if (dateRegex.test(dateStr) && timeRegex.test(timeStr) && detailsRegex.test(detailsStr)) {
        return { date: dateStr, time: timeStr, details: detailsStr };
    }
    return null;
}

// Helper function to create a compact JSON representation of the parsed contract
function createContractJson(parseResult: ParseResult): string {
    const contract = parseResult.contract;
    
    // Create a simplified representation
    const contractData: any = {
        type: parseResult.contractType,
        sport: contract.Sport,
        league: contract.League,
        teams: {
            team1: contract.Match.Team1,
            team2: contract.Match.Team2
        }
    };

    // Add period only for match contracts (not series)
    if ('Period' in contract) {
        contractData.period = {
            type: contract.Period.PeriodTypeCode,
            number: contract.Period.PeriodNumber
        };
    }

    // Add DaySequence if present
    if (contract.Match.DaySequence) {
        contractData.teams.daySeq = contract.Match.DaySequence;
    }

    // Add type-specific properties
    if ('Line' in contract) {
        contractData.line = contract.Line;
    }
    if ('IsOver' in contract) {
        contractData.isOver = contract.IsOver;
    }
    if ('Contestant' in contract) {
        contractData.contestant = contract.Contestant;
    }
    if ('SeriesLength' in contract) {
        contractData.seriesLength = contract.SeriesLength;
    }
    if ('Prop' in contract) {
        contractData.prop = contract.Prop;
    }
    if ('IsYes' in contract) {
        contractData.isYes = contract.IsYes;
    }

    return JSON.stringify(contractData);
}

// Modified to include grading with ChatBetGradingClient
export async function processFile(filePath: string, gradingClient?: ChatBetGradingClient) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const processedBets: ProcessedBet[] = []; // Store successfully parsed Bet objects
    const linesToWarnBasicFormat: string[] = []; // For lines failing basic CSV structure

    // Define regex patterns for conditions
    const nothingOnRegex = /^["']?(nothing (on|for)|had late)/i; // Case-insensitive, optional leading quote
    const hyphenLineRegex = /^[-]+$/; // Matches one or more hyphens
    const commentLineRegex = /^#/; // Matches lines starting with #

    lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            // Skip empty lines silently
            return;
        }

        const validatedParts = validateLine(trimmedLine); // validateLine returns { date, time, details } | null
        
        if (validatedParts) {
            // Line has basic valid structure, now try to parse into ProcessedBet object
            const bet = parseBetDetailsWithChatBetParse(validatedParts.date, validatedParts.time, validatedParts.details);
            if (bet) {
                processedBets.push(bet);
            } else {
                // parseBetDetailsWithChatBetParse already logged a warning with specifics via console.warn
                // Log the problematic line for context if detailed parsing fails
                console.log(`INFO: Line failed detailed parsing (see warnings above): '${trimmedLine}'`);
            }
        } else {
            // Line is invalid, determine if a warning should be logged
            let suppressWarning = false;

            if (hyphenLineRegex.test(trimmedLine)) {
                suppressWarning = true;
            }
            else if (nothingOnRegex.test(trimmedLine)) {
                suppressWarning = true;
            }
            else if (commentLineRegex.test(trimmedLine)) {
                suppressWarning = true;
            }
            else {
                const parts = trimmedLine.split(',').map((part: string) => part.trim());
                if (parts.length === 3 && nothingOnRegex.test(parts[2])) {
                    suppressWarning = true;
                }
            }

            if (!suppressWarning) {
                linesToWarnBasicFormat.push(trimmedLine);
            }
        }
    });

    // Print warnings for lines that failed basic format validation
    linesToWarnBasicFormat.forEach(line => {
        console.log(`WARNING: invalid line (basic format): '${line}'`);
    });

    if (linesToWarnBasicFormat.length > 0 && processedBets.length > 0) {
        console.log('\n'); // Separator
    }

    const printFormattedTable = (title: string, headers: string[], rowsData: (string | number | Date | boolean | undefined)[][]) => {
        if (rowsData.length === 0) {
            // console.log(`No data for table: ${title}`); // Optional: log if no data for a specific table
            return;
        }

        const columnWidths = headers.map((header, colIndex) => {
            let maxWidth = header.length;
            for (const row of rowsData) {
                const cellValue = row[colIndex];
                const cellLength = String(cellValue ?? '').length;
                if (cellLength > maxWidth) {
                    maxWidth = cellLength;
                }
            }
            return maxWidth;
        });

        const outputTableLines: string[] = [];
        outputTableLines.push(
            headers.map((header, i) => header.padEnd(columnWidths[i])).join(', ')
        );

        rowsData.forEach(row => {
            outputTableLines.push(
                row.map((cell, i) => {
                    return String(cell ?? '').padEnd(columnWidths[i]);
                }).join(', ')
            );
        });
        
        const finalStringToPrint = `\n${title}\n${outputTableLines.join('\n')}`;
        console.log(finalStringToPrint);
    };

    // Extract just the filename from the full path for display
    const filename = path.basename(filePath);

    if (processedBets.length > 0) {
        const headers = ['Input', 'Contract', 'Price', 'Size', 'Grade', 'PNL'];
        
        const rowsData = await processWithConcurrencyLimit(processedBets, async (bet) => {
            let contractDisplay: string;
            let price: string | number = '';
            let size: string | number = '';
            let grade = '?'; // Default grade
            let pnlDisplay: string | number = '';

            // Determine contract display
            if (bet.parseResult) {
                contractDisplay = createContractJson(bet.parseResult);
                price = bet.price ?? '';
                if (bet.size !== undefined) {
                    size = bet.size.toFixed(2);
                }

                // Try to grade the bet if we have a grading client
                if (gradingClient) {
                    try {
                        // Extract match date from execution date (just the date part)
                        const matchDate = new Date(bet.executionDtm);
                        matchDate.setHours(0, 0, 0, 0); // Set to start of day
                        
                        grade = await gradingClient.grade(bet.parseResult, {
                            matchScheduledDate: matchDate
                        });
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        grade = `ERR: ${errorMessage.trim()}`;
                    }
                }

                // Calculate PNL if we have a valid grade and bet details
                if (bet.price !== undefined && bet.size !== undefined) {
                    const riskAndToWin = calculateRiskAndToWin(bet.price, bet.size);
                    if (riskAndToWin) {
                        const { risk, toWin } = riskAndToWin;
                        if (grade === 'L') {
                            pnlDisplay = (-risk).toFixed(2);
                        } else if (grade === 'W') {
                            pnlDisplay = toWin.toFixed(2);
                        } else if (grade === 'P' || grade === 'C' || grade === 'T') {
                            pnlDisplay = '0.00';
                        }
                        // For grades like '?' or errors, leave PNL empty
                    }
                }
            } else {
                contractDisplay = `PARSE_ERROR: ${bet.parseError || 'Unknown error'}`;
            }

            return [
                bet.rawInput,
                contractDisplay,
                price,
                size,
                grade,
                pnlDisplay
            ];
        });

        printFormattedTable(`--- Processed Bets for ${filename} ---`, headers, rowsData);

        // --- BEGIN SUMMARY CALCULATIONS AND PRINTING ---
        const pnlSummariesData: { date: Date, pnl: number }[] = [];
        if (rowsData.length === processedBets.length) { // Ensure rowsData is populated and matches processedBets
            for (let i = 0; i < processedBets.length; i++) {
                const bet = processedBets[i];
                const row = rowsData[i] as (string | number | Date | boolean | undefined)[]; // Type assertion
                const pnlDisplay = row[5]; // pnlDisplay is the 6th element (string or number)

                let pnlValue: number | undefined = undefined;

                if (typeof pnlDisplay === 'string' && pnlDisplay.trim() !== '') {
                    const parsedPnl = parseFloat(pnlDisplay);
                    if (!isNaN(parsedPnl)) {
                        pnlValue = parsedPnl;
                    }
                } else if (typeof pnlDisplay === 'number') {
                    pnlValue = pnlDisplay;
                }

                if (pnlValue !== undefined) {
                    pnlSummariesData.push({
                        date: new Date(bet.executionDtm.valueOf()), 
                        pnl: pnlValue
                    });
                }
            }
        }
        
        printDailySummary(pnlSummariesData);
        printWeeklySummary(pnlSummariesData);
        printTotalSummary(pnlSummariesData);
        // --- END SUMMARY CALCULATIONS AND PRINTING ---

    } else {
        console.log(`No processable bets found in ${filename} after detailed parsing.`);
    }
}

// New function to manage file processing with optional grading
async function runOperations() {
    const args = process.argv.slice(2);
    if (args.length > 0 && (args[0] === '-h' || args[0] === '--help')) {
        console.log("Usage: ts-node scripts/mlb_quick_grade.ts <file_path1> [file_path2] [...]");
        console.log("Processes CSV-like files, parsing lines into Bet objects using chat-bet-parse.");
        console.log("Multiple files can be specified and each will generate a separate report.");
        console.log("Set DB_CONNECTION_STRING environment variable to enable grading.");
        process.exit(0);
    }

    if (args.length === 0) {
        console.error("Usage: ./mlb_quick_grade.js <file_path1> [file_path2] [...] or node mlb_quick_grade.js <file_path1> [file_path2] [...]");
        console.error("At least one file path must be provided.");
        process.exit(1);
    }

    let gradingClient: ChatBetGradingClient | undefined;

    try {
        // Initialize grading client if connection string is available
        const dbConnectionString = process.env.DB_CONNECTION_STRING;
        if (dbConnectionString) {
            gradingClient = new ChatBetGradingClient(dbConnectionString);
            console.log("Grading client initialized with database connection.");
        } else {
            console.log("No DB_CONNECTION_STRING found. Grading will be disabled (grades will show as '?').");
        }

        // Process each file separately
        for (let i = 0; i < args.length; i++) {
            const filePath = args[i];
            
            // Add separator between files (except for the first file)
            if (i > 0) {
                console.log('\n' + '='.repeat(80) + '\n');
            }
            
            await processFile(filePath, gradingClient);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Operation failed:', message);
        throw err;
    } finally {
        // Close grading client if it was initialized
        if (gradingClient) {
            try {
                await gradingClient.close();
                console.log("Grading client connection closed.");
            } catch (closeErr: unknown) {
                const message = closeErr instanceof Error ? closeErr.message : String(closeErr);
                console.error('Error closing grading client connection:', message);
            }
        }
    }
}

if (require.main === module) {
    runOperations().catch(err => {
        process.exit(1);
    });
}

// For CommonJS compatibility
module.exports = {
    processFile, validateLine, parseBetDetailsWithChatBetParse, calculateRiskAndToWin
};