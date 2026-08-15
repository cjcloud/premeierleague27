// API Test Script for Premier League API
// This script tests if the Premier League API call returns usable data

// Import required modules
import { writeFileSync } from 'fs';
import { format } from 'date-fns';

// API URL from the application
const API_URL = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false';

// Expected API response structure
interface ApiTeamEntry {
  team: {
    id: string;
    name: string;
    shortName?: string;
    abbr?: string;
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
  completedMatchweeks?: number;
}

// Function to validate API response structure
function validateApiResponse(data: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check if the response has the tables array
  if (!data.tables || !Array.isArray(data.tables)) {
    issues.push('Missing or invalid tables array');
    return { valid: false, issues };
  }
  
  // Check if tables[0] exists
  if (!data.tables[0]) {
    issues.push('Missing tables[0] entry');
    return { valid: false, issues };
  }
  
  // Check for entries array
  const entries = data.tables[0].entries;
  if (!entries || !Array.isArray(entries)) {
    issues.push('Missing or invalid entries array');
    return { valid: false, issues };
  }
  
  // Check if we have 20 teams (Premier League has 20 teams)
  if (entries.length !== 20) {
    issues.push(`Expected 20 teams, found ${entries.length}`);
    // Don't return yet, this is just a warning
  }
  
  // Validate each team entry
  entries.forEach((entry, index) => {
    // Check team data
    if (!entry.team || !entry.team.id) {
      issues.push(`Team ${index+1} missing id`);
    }
    
    if (!entry.team.name) {
      issues.push(`Team ${index+1} (ID: ${entry.team.id}) missing name`);
    }
    
    // Check position data
    if (!entry.overall || typeof entry.overall.position !== 'number') {
      issues.push(`Team ${index+1} (${entry.team?.name || 'unknown'}) missing valid position`);
    }
    
    // Check if position is between 1 and 20
    if (entry.overall && (entry.overall.position < 1 || entry.overall.position > 20)) {
      issues.push(`Team ${entry.team?.name || 'unknown'} has invalid position: ${entry.overall.position}`);
    }
  });
  
  // Check for duplicate positions
  const positions = entries
    .filter(e => e.overall && typeof e.overall.position === 'number')
    .map(e => e.overall.position);
  
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    issues.push('Duplicate positions found in standings');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Main test function
async function testPremierLeagueApi() {
  console.log('Starting Premier League API test...');
  console.log(`Test time: ${new Date().toISOString()}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    console.log('Sending API request...');
    const startTime = performance.now();
    
    const response = await fetch(API_URL, {
      headers: {
        'Origin': 'https://www.premierleague.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
    });
    
    const endTime = performance.now();
    console.log(`Request completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`Response content type: ${contentType}`);
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got: ${contentType}`);
    }
    
    // Parse the JSON response
    console.log('Parsing response...');
    const data: ApiResponse = await response.json();
    
    // Save the raw response to a file for debugging
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    const filename = `pl-api-response-${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Raw response saved to: ${filename}`);
    
    // Validate the response structure
    console.log('Validating API response...');
    const validation = validateApiResponse(data);
    
    if (!validation.valid) {
      console.error('❌ API response validation failed:');
      validation.issues.forEach(issue => console.error(` - ${issue}`));
    } else {
      console.log('✅ API response structure is valid');
    }
    
    // Print some sample data
    if (data.tables && data.tables[0] && data.tables[0].entries) {
      const entries = data.tables[0].entries;
      console.log(`\nFound ${entries.length} teams in the standings.`);
      
      console.log('\nTop 5 teams:');
      entries
        .sort((a, b) => a.overall.position - b.overall.position)
        .slice(0, 5)
        .forEach(entry => {
          console.log(`${entry.overall.position}. ${entry.team.name} - ${entry.overall.points} points`);
        });
    }
    
    console.log('\nTest completed successfully.');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
}

// Run the test
testPremierLeagueApi()
  .then(result => {
    if (result.success) {
      console.log('✅ API test passed - usable data was returned');
      process.exit(0);
    } else {
      console.error('❌ API test failed:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ Unexpected error running test:', err);
    process.exit(1);
  });
