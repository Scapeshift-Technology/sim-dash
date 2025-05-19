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

function printTable(headers: string[], rows: (string | number | undefined)[][]) {
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

function validateLine(line: string): { date: string; time: string; details: string } | null {
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

function processFile(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    const validLines: Array<{ date: string; time: string; details: string }> = [];
    const linesToWarn: string[] = [];

    // Define regex patterns for conditions
    const nothingOnRegex = /^["']?(nothing (on|for)|had late)/i; // Case-insensitive, optional leading quote
    const hyphenLineRegex = /^[-]+$/; // Matches one or more hyphens

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            // Skip empty lines silently
            return;
        }

        const parsedLine = validateLine(trimmedLine);
        if (parsedLine) {
            validLines.push(parsedLine);
        } else {
            // Line is invalid, determine if a warning should be logged
            let suppressWarning = false;

            // Condition 1: Line is all hyphens
            if (hyphenLineRegex.test(trimmedLine)) {
                suppressWarning = true;
            }
            // Condition 2: Line starts with "nothing on" (optional quote, case-insensitive)
            else if (nothingOnRegex.test(trimmedLine)) {
                suppressWarning = true;
            }
            // Condition 3: Third column string starts with "nothing on" (optional quote, case-insensitive)
            else {
                const parts = trimmedLine.split(',').map(part => part.trim());
                if (parts.length === 3 && nothingOnRegex.test(parts[2])) {
                    suppressWarning = true;
                }
            }

            if (!suppressWarning) {
                linesToWarn.push(trimmedLine);
            }
        }
    });

    // Print warnings for lines that meet the criteria
    linesToWarn.forEach(line => {
        console.log(`WARNING: invalid line: '${line}'`);
    });

    // Adjust newline based on actual warnings printed
    if (linesToWarn.length > 0 && validLines.length > 0) {
        console.log('\n');
    }

    if (validLines.length > 0) {
        const headers = ['Date', 'Time', 'Details'];
        const rows = validLines.map(vl => [vl.date, vl.time, vl.details]);
        printTable(headers, rows);
    } else if (linesToWarn.length === 0) { // No valid lines AND no (unsuppressed) warnings were logged
        console.log("No processable content found in the file.");
    }
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

    } catch (err) {
        console.error('Database connection or query failed:', err.message);
        if (err.originalError) { // mssql driver often provides more details here
             console.error('Original error:', err.originalError.message);
        }
        process.exit(1);
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (closeErr) {
                // Log error during close, but don't necessarily exit if main operations succeeded
                console.error('Error closing database connection:', closeErr.message);
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
    runOperations().catch(err => {
        // Catch any unhandled errors from the async runOperations function
        console.error("Unhandled error during script execution:", err);
        process.exit(1);
    });
}

module.exports = { processFile, validateLine }; // For potential testing 