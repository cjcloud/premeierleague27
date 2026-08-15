/**
 * Comprehensive Premier League API Test
 * This test simulates the full API interaction used in the application
 */

import { format } from 'date-fns';
import * as fs from 'fs';
import * as path from 'path';

// API URL from the application
const API_URL = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false';

// Use the same interfaces as the main application
interface ApiTeamEntry {
  team: {
    id: string;
    name: string;
    shortName?: string;
    abbreviation?: string;
  };
  overall: {
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
}

interface ApiResponse {
  tables: {
    entries: ApiTeamEntry[];
  }[];
  matchweek?: number;
  season?: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

interface TeamData {
  apiId: number;
  name: string;
  shortName?: string;
  abbr?: string;
  actualPosition: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface TestResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  teamsData?: TeamData[];
  validationResult?: ValidationResult;
}

/**
 * Validates the API response structure and data
 */
function validateApiResponse(data: any): ValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check if the response has the tables array
  if (!data.tables || !Array.isArray(data.tables)) {
    issues.push('Missing or invalid tables array');
    return { valid: false, issues, warnings };
  }
  
  // Check if tables[0] exists
  if (!data.tables[0]) {
    issues.push('Missing tables[0] entry');
    return { valid: false, issues, warnings };
  }
  
  // Check for entries array
  const entries = data.tables[0].entries;
  if (!entries || !Array.isArray(entries)) {
    issues.push('Missing or invalid entries array');
    return { valid: false, issues, warnings };
  }
  
  // Check if we have 20 teams (Premier League has 20 teams)
  if (entries.length !== 20) {
    warnings.push(`Expected 20 teams, found ${entries.length}`);
  }
  
  // Validate each team entry
  entries.forEach((entry: any, index: number) => {
    // Check team data
    if (!entry.team || !entry.team.id) {
      issues.push(`Team ${index+1} missing id`);
    }
    
    if (!entry.team.name) {
      issues.push(`Team ${index+1} (ID: ${entry.team?.id}) missing name`);
    }
    
    // Check position data
    if (!entry.overall || typeof entry.overall.position !== 'number') {
      issues.push(`Team ${index+1} (${entry.team?.name || 'unknown'}) missing valid position`);
    }
    
    // Check if position is between 1 and entries.length
    if (entry.overall && (entry.overall.position < 1 || entry.overall.position > entries.length)) {
      issues.push(`Team ${entry.team?.name || 'unknown'} has invalid position: ${entry.overall.position}`);
    }
    
    // Validate other required fields
    const requiredOverallFields = ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points'];
    requiredOverallFields.forEach(field => {
      if (entry.overall && typeof entry.overall[field] !== 'number') {
        issues.push(`Team ${entry.team?.name || 'unknown'} missing valid ${field} value`);
      }
    });
  });
  
  // Check for duplicate positions
  const positions = entries
    .filter((e: any) => e.overall && typeof e.overall.position === 'number')
    .map((e: any) => e.overall.position);
  
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    issues.push('Duplicate positions found in standings');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Maps API data to the format used by the application database
 */
function mapApiDataToTeamData(data: ApiResponse): TeamData[] {
  if (!data.tables || !data.tables[0] || !data.tables[0].entries) {
    return [];
  }
  
  return data.tables[0].entries.map(entry => ({
    apiId: parseInt(entry.team.id, 10),
    name: entry.team.name,
    shortName: entry.team.shortName,
    abbr: entry.team.abbreviation,
    actualPosition: entry.overall.position,
    points: entry.overall.points,
    played: entry.overall.played,
    won: entry.overall.won,
    drawn: entry.overall.drawn,
    lost: entry.overall.lost,
    goalsFor: entry.overall.goalsFor,
    goalsAgainst: entry.overall.goalsAgainst,
    goalDifference: entry.overall.goalDifference
  }));
}

/**
 * Main test function that simulates the API call and processes the response
 */
async function testPremierLeagueApi(): Promise<TestResult> {
  console.log('=== Comprehensive Premier League API Test ===');
  console.log(`Test time: ${new Date().toLocaleString()}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    console.log('\nSending API request...');
    const startTime = Date.now();
    
    const response = await fetch(API_URL, {
      headers: {
        'Origin': 'https://www.premierleague.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
    });
    
    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`Response content type: ${contentType}`);
    
    // Parse the JSON response
    console.log('Parsing response...');
    const data: ApiResponse = await response.json();
    
    // Save the raw response to a JSON file
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = path.join(process.cwd(), `pl-api-response-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Raw response saved to: ${filename}`);
    
    // Validate the response
    console.log('\nValidating API response...');
    const validationResult = validateApiResponse(data);
    
    if (validationResult.issues.length > 0) {
      console.error('❌ API response validation issues:');
      validationResult.issues.forEach(issue => console.error(` - ${issue}`));
    }
    
    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ API response warnings:');
      validationResult.warnings.forEach(warning => console.warn(` - ${warning}`));
    }
    
    if (validationResult.valid) {
      console.log('✅ API response structure is valid');
    }
    
    // Extract and transform team data
    const teamsData = mapApiDataToTeamData(data);
    
    // Display team standings
    console.log(`\nFound ${teamsData.length} teams in the standings.`);
    
    if (teamsData.length > 0) {
      console.log('\nCurrent Premier League Standings:');
      console.log('-----------------------------------');
      console.log('Pos | Team                    | P  | W | D | L | GF | GA | GD | Pts');
      console.log('-----------------------------------');
      
      teamsData
        .sort((a, b) => a.actualPosition - b.actualPosition)
        .forEach(team => {
          const teamName = team.name.padEnd(22).substring(0, 22);
          console.log(
            `${String(team.actualPosition).padStart(2)} | ${teamName} | ` +
            `${String(team.played).padStart(2)} | ${String(team.won).padStart(1)} | ${String(team.drawn).padStart(1)} | ${String(team.lost).padStart(1)} | ` +
            `${String(team.goalsFor).padStart(2)} | ${String(team.goalsAgainst).padStart(2)} | ${String(team.goalDifference).padStart(3)} | ${String(team.points).padStart(3)}`
          );
        });
    }
    
    // Summary
    console.log('\n✅ TEST PASSED: Premier League API returned valid and usable data');
    console.log(`✅ Successfully extracted data for ${teamsData.length} teams`);
    
    return { 
      success: true, 
      message: 'API test passed successfully',
      data,
      teamsData,
      validationResult
    };
    
  } catch (error: any) {
    console.error('\n❌ API test failed:');
    console.error(` - ${error.message || 'Unknown error'}`);
    
    return { 
      success: false, 
      message: 'API test failed',
      error: error.message || 'Unknown error'
    };
  }
}

// Run the test
testPremierLeagueApi()
  .then(result => {
    if (result.success) {
      console.log('\n✅ COMPREHENSIVE API TEST PASSED');
      process.exit(0);
    } else {
      console.error('\n❌ COMPREHENSIVE API TEST FAILED:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\n❌ UNEXPECTED TEST ERROR:', err);
    process.exit(1);
  });
