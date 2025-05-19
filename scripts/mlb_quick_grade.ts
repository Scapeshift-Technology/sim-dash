#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sql = require('mssql'); // SQL Server driver
// Type Definitions

export interface Match {
    Date: Date;
    Team1: string;
    Team2?: string;
    DaySequence?: number; // Defaults to 1 if not provided
}

export interface Period {
    PeriodTypeCode: string; // CHAR(2)
    PeriodNumber: number;
}

export interface Contract_Match_Base {
    Period: Period;
    Match: Match;
}

export interface Contract_Match_Total extends Contract_Match_Base {
    Line: number; // Must be divisible by 0.5 (runtime validation)
    IsOver: boolean;
}

export interface Contract_Match_TeamTotal extends Contract_Match_Total {
    Team: string;
}

export type Contract_Match = Contract_Match_Total | Contract_Match_TeamTotal;

export interface Bet {
    ExecutionDtm: Date;
    Price: number; // Assuming money is represented as a number
    Size: number; // Assuming money is represented as a number
    ContractMatch: Contract_Match;
}

// Default value for DaySequence can be handled in functions creating Match objects
// const defaultMatch: Match = { Date: new Date(), Team1: "Team A", DaySequence: 1 };

// --- BEGIN NEW PARSING LOGIC ---

// Function to parse USA style odds
// Based on user's Python snippet and examples, handles "ev", "even" and numeric odds (including decimals).
export function parse_usa_price(rawPriceStr: string): number {
    const cleanedPriceStr = rawPriceStr.trim().toLowerCase();

    if (cleanedPriceStr === 'ev' || cleanedPriceStr === 'even') {
        return 100;
    }

    // Matches standard odds like +150, -200, or decimal odds like -115.5
    // User regex was: /(?P<usa_price>[+-]?\\d{3,}|ev(?:en)?(?: |$))/
    // This version is more aligned with the example Price: -115.5
    const pricePattern = /^[+-]?\d+(\.\d+)?$/;
    if (pricePattern.test(cleanedPriceStr)) {
        const price = parseFloat(cleanedPriceStr);
        if (isNaN(price)) {
            throw new Error(`Price string "${rawPriceStr}" resulted in NaN after parseFloat.`);
        }
        return price;
    }
    throw new Error(`Invalid USA price format: "${rawPriceStr}"`);
}

const periodStringMap: { [key: string]: Period } = {
    "1st inning": { PeriodTypeCode: 'I', PeriodNumber: 1 },
    "f5": { PeriodTypeCode: 'H', PeriodNumber: 1 },
    "fg": { PeriodTypeCode: 'M', PeriodNumber: 0 }
};
const defaultPeriodDetails: Period = { PeriodTypeCode: 'M', PeriodNumber: 0 };

// Regex for OU_PATT based on user: /(?P<over_or_under>[ou])(?P<line>\d+(?:[.]5)?)( *runs)?/
// JS version, matching at the end of the relevant string segment.
// Assumes 'o' or 'u' must be lowercase as per examples.
const ouPatternRegex = /(?<over_or_under>[ou])(?<line>\d+(?:\.5)?)(?: *runs)?$/;

export function parseBetDetails(dateOnlyStr: string, timeOnlyStr: string, rawDetailsYg: string): Bet | null {
    try {
        // Create date in local timezone then adjust to UTC
        const localDate = new Date(`${dateOnlyStr} ${timeOnlyStr}`);
        if (isNaN(localDate.getTime())) {
            console.warn(`[DetailParse WARN] Invalid date/time for ExecutionDtm: ${dateOnlyStr} ${timeOnlyStr} from line part: ${rawDetailsYg}`);
            return null;
        }
        // Keep ExecutionDtm as is (local timezone interpretation)
        const executionDtm = localDate;

        // For Match.Date, we only care about the date portion, not the time
        const matchDate = new Date(dateOnlyStr);
        if (isNaN(matchDate.getTime())) {
            console.warn(`[DetailParse WARN] Invalid date for Match.Date: ${dateOnlyStr} from line part: ${rawDetailsYg}`);
            return null;
        }

        if (!rawDetailsYg.toUpperCase().startsWith("YG")) {
            // This should be caught by validateLine logic, but as a safeguard.
            console.warn(`[DetailParse WARN] Details string does not start with YG (should be pre-validated): ${rawDetailsYg}`);
            return null;
        }
        let details = rawDetailsYg.substring(2).trimStart(); // Remove "YG" and leading spaces

        const atSplit = details.split(/ @ /);
        if (atSplit.length !== 2) {
            console.warn(`[DetailParse WARN] Details string missing ' @ ' separator or has too many: "${details}"`);
            return null;
        }
        let teamPeriodLineInfo = atSplit[0].trim();
        const priceAndSizeInfo = atSplit[1].trim();

        const eqSplit = priceAndSizeInfo.split(/ = /);
        if (eqSplit.length !== 2) {
            console.warn(`[DetailParse WARN] Price/Size string missing ' = ' separator or has too many: "${priceAndSizeInfo}"`);
            return null;
        }
        const priceStr = eqSplit[0].trim();
        const sizeStr = eqSplit[1].trim();

        const betPrice = parse_usa_price(priceStr); // Can throw error

        const rawSize = parseFloat(sizeStr);
        if (isNaN(rawSize)) {
            console.warn(`[DetailParse WARN] Invalid size (not a number): ${sizeStr}`);
            return null;
        }
        const betSize = rawSize * 1000;


        const ouMatch = teamPeriodLineInfo.match(ouPatternRegex);
        if (!ouMatch || !ouMatch.groups) {
            console.warn(`[DetailParse WARN] Details string does not match Over/Under pattern: "${teamPeriodLineInfo}"`);
            return null;
        }
        const { over_or_under, line: lineStr } = ouMatch.groups;
        const isOver = over_or_under === 'o'; // Assumes 'o' or 'u' (lowercase)
        const parsedLineVal = parseFloat(lineStr);

        if (isNaN(parsedLineVal) || parsedLineVal < 0 || parsedLineVal * 10 % 5 !== 0) { // check for divisibility by 0.5
            console.warn(`[DetailParse WARN] Invalid line value "${lineStr}" (not a non-negative number divisible by 0.5).`);
            return null;
        }

        let teamAndPeriodStr = teamPeriodLineInfo.substring(0, ouMatch.index).trim();

        let currentPeriod: Period = defaultPeriodDetails;
        for (const key in periodStringMap) {
            if (teamAndPeriodStr.toLowerCase().endsWith(key)) {
                currentPeriod = periodStringMap[key];
                teamAndPeriodStr = teamAndPeriodStr.substring(0, teamAndPeriodStr.toLowerCase().lastIndexOf(key)).trim();
                break;
            }
        }
        
        let teamPartForProcessing = teamAndPeriodStr;
        const ttPattern = / TT$/i; // " TT" at the end of the team string, case insensitive
        const isTeamTotal = ttPattern.test(teamPartForProcessing);
        
        if (isTeamTotal) {
            teamPartForProcessing = teamPartForProcessing.replace(ttPattern, "").trim();
        }
        
        const teams = teamPartForProcessing.split("/").map(t => t.trim()).filter(t => t.length > 0);
        
        if (teams.length === 0) {
            console.warn(`[DetailParse WARN] No teams found in: "${teamPartForProcessing}"`);
            return null;
        }
        const team1 = teams[0];
        const team2 = teams.length > 1 ? teams[1] : undefined;

        if (isTeamTotal && team2) {
            console.warn(`[DetailParse WARN] Error: Two teams ("${team1}", "${team2}") specified with TT in "${teamAndPeriodStr}"`);
            return null;
        }
        if (isTeamTotal && teams.length > 1) {
             console.warn(`[DetailParse WARN] Error: Multiple team segments ("${teams.join(',')}") found before 'TT' designation in "${teamAndPeriodStr}"`);
            return null;
        }


        const matchInfo: Match = {
            Date: matchDate,
            Team1: team1,
            Team2: team2,
            DaySequence: 1 // Default
        };

        let contractMatch: Contract_Match;
        if (isTeamTotal) {
            contractMatch = {
                Period: currentPeriod,
                Match: matchInfo,
                Line: parsedLineVal,
                IsOver: isOver,
                Team: team1
            } as Contract_Match_TeamTotal;
        } else {
            contractMatch = {
                Period: currentPeriod,
                Match: matchInfo,
                Line: parsedLineVal,
                IsOver: isOver
            } as Contract_Match_Total;
        }

        const bet: Bet = {
            ExecutionDtm: executionDtm,
            Price: betPrice,
            Size: betSize,
            ContractMatch: contractMatch
        };
        return bet;

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
    const detailsRegex = /^YG/;

    if (dateRegex.test(dateStr) && timeRegex.test(timeStr) && detailsRegex.test(detailsStr)) {
        return { date: dateStr, time: timeStr, details: detailsStr };
    }
    return null;
}

export function processFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const parsedBets: Bet[] = []; // Store successfully parsed Bet objects
    const linesToWarnBasicFormat: string[] = []; // For lines failing basic CSV structure

    // Define regex patterns for conditions
    const nothingOnRegex = /^["']?(nothing (on|for)|had late)/i; // Case-insensitive, optional leading quote
    const hyphenLineRegex = /^[-]+$/; // Matches one or more hyphens

    lines.forEach((line: string) => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            // Skip empty lines silently
            return;
        }

        const validatedParts = validateLine(trimmedLine); // validateLine returns { date, time, details } | null
        
        if (validatedParts) {
            // Line has basic valid structure, now try to parse into Bet object
            const bet = parseBetDetails(validatedParts.date, validatedParts.time, validatedParts.details);
            if (bet) {
                parsedBets.push(bet);
            } else {
                // parseBetDetails already logged a warning with specifics via console.warn
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

    if (linesToWarnBasicFormat.length > 0 && parsedBets.length > 0) {
        console.log('\n'); // Separator
    }

    if (parsedBets.length > 0) {
        console.log("Successfully parsed bets output (JSON format):");
        parsedBets.forEach((bet, index) => {
            console.log(`--- Bet ${index + 1} ---`);
            console.log(JSON.stringify(bet, null, 2));
        });
        
        // The original printTable is not suitable for complex Bet objects.
        // If a table summary is needed, it would require a new function
        // to extract specific fields from the Bet objects.
        // console.log("--- Original Table Format (Example if adapted) ---");
        // const headersForBets = ['Exec DTM', 'Team1', 'Period', 'Line', 'IsOver', 'Price', 'Size'];
        // const rowsForBets = parsedBets.map(b => [
        // b.ExecutionDtm.toLocaleString(),
        // b.ContractMatch.Match.Team1,
        // `${b.ContractMatch.Period.PeriodTypeCode}${b.ContractMatch.Period.PeriodNumber}`,
        // b.ContractMatch.Line,
        // b.ContractMatch.IsOver,
        // b.Price,
        // b.Size
        // ]);
        // printTable(headersForBets, rowsForBets);


    } else if (linesToWarnBasicFormat.length === 0) { 
        console.log("No processable bets found in the file after detailed parsing.");
    }
    // Original printTable call block commented out
    // if (validLines.length > 0) {
    //     const headers = ['Date', 'Time', 'Details'];
    //     const rows = validLines.map(vl => [vl.date, vl.time, vl.details]);
    //     printTable(headers, rows);
    // } else if (linesToWarn.length === 0) { 
    //     console.log("No processable content found in the file.");
    // }
}

// New async function to manage database operations and subsequent file processing
async function runOperations() {
    const dbConnectionString = process.env.DB_CONNECTION_STRING;
    if (!dbConnectionString) {
        console.error('Error: DB_CONNECTION_STRING environment variable is not set.');
        process.exit(1);
    }

    let pool; // Declare pool outside try so it can be used in finally
    try {
        // Attempt to connect to the database
        pool = await sql.connect(dbConnectionString);
        console.log("connection succeeded");

        // Execute the query
        const queryText = "SELECT COUNT(*) FROM dbo.LeagueTeam_V WHERE League = 'MLB'";
        const result = await pool.request().query(queryText);

        // Print the results as a single JSON string
        console.log(JSON.stringify(result.recordset, null, 2));

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Database connection or query failed:', message);
        if (err && typeof err === 'object' && 'originalError' in err && err.originalError && typeof err.originalError === 'object' && 'message' in err.originalError) {
             console.error('Original error:', err.originalError.message);
        }
        process.exit(1);
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeErr: unknown) {
                // Log error during close, but don't necessarily exit if main operations succeeded
                const message = closeErr instanceof Error ? closeErr.message : String(closeErr);
                console.error('Error closing database connection:', message);
            }
        }
    }

    // Original script's argument parsing and file processing logic
    // This part will only run if the database operations above did not cause an exit
    const args = process.argv.slice(2);
    if (args.length !== 1) {
        console.error("Usage: ./mlb_quick_grade.js <file_path> or node mlb_quick_grade.js <file_path>");
        process.exit(1);
    }
    const filePath = args[0];
    processFile(filePath); // Call the original file processing function
}

if (require.main === module) {
    // const args = process.argv.slice(2);
    // if (args.length !== 1) {
    //     console.error("Usage: node process_log.js <file_path>"); // Original, incorrect usage message
    //     process.exit(1);
    // }
    // const filePath = args[0];
    // processFile(filePath);

    // Update usage message for TypeScript execution
    const args = process.argv.slice(2);
    if (args.length > 0 && (args[0] === '-h' || args[0] === '--help')) {
        console.log("Usage: ts-node scripts/mlb_quick_grade.ts <file_path>");
        console.log("Processes a CSV-like file, parsing lines into Bet objects.");
        console.log("Connects to DB specified by DB_CONNECTION_STRING and runs a test query before file processing.");
        process.exit(0);
    }
    
    runOperations().catch(err => {
        // Catch any unhandled errors from the async runOperations function
        console.error("Unhandled error during script execution:", err);
        process.exit(1);
    });
}

// For CommonJS compatibility
module.exports = { processFile, validateLine, parseBetDetails, parse_usa_price };
// This export ensures compatibility with both ES modules and CommonJS 