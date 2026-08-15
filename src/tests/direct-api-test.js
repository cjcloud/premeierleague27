/**
 * Direct Premier League API Test
 * This script makes a direct API call to test the Premier League API
 * with minimal dependencies and straightforward validation
 */

// API URL from the application
const API_URL = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false';

// Main test function - uses plain JS and only core features
async function testPremierLeagueApi() {
  console.log('=== Direct Premier League API Test ===');
  console.log(`Test time: ${new Date().toISOString()}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Step 1: Make the API request
    console.log('\nSending API request...');
    const response = await fetch(API_URL, {
      headers: {
        'Origin': 'https://www.premierleague.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Step 2: Parse the JSON response
    const data = await response.json();
    
    // Step 3: Basic validation
    console.log('\nValidating API data structure...');
    
    if (!data || typeof data !== 'object') {
      throw new Error('Response is not a valid object');
    }
    
    if (!data.tables || !Array.isArray(data.tables) || !data.tables[0]) {
      throw new Error('Response missing tables array structure');
    }
    
    const entries = data.tables[0].entries;
    if (!entries || !Array.isArray(entries)) {
      throw new Error('Response missing team entries array');
    }
    
    console.log(`✓ Found ${entries.length} teams in the standings`);
    
    // Step 4: Extract team data and display
    console.log('\nExtracting team data...');
    
    const teamData = entries.map(entry => {
      return {
        id: entry.team.id,
        name: entry.team.name,
        position: entry.overall.position,
        played: entry.overall.played,
        points: entry.overall.points
      };
    }).sort((a, b) => a.position - b.position);
    
    // Step 5: Display results
    console.log('\nCurrent Premier League Table:');
    console.log('-----------------------------');
    console.log('Pos | Team                    | P  | Pts');
    console.log('-----------------------------');
    
    teamData.forEach(team => {
      const name = team.name.padEnd(22, ' ').substring(0, 22);
      const pos = String(team.position).padStart(2);
      const played = String(team.played).padStart(2);
      const points = String(team.points).padStart(3);
      
      console.log(`${pos} | ${name} | ${played} | ${points}`);
    });
    
    // Step 6: Test if data can be used to update database
    console.log('\nValidating data for database updates...');
    
    // Check if all teams have integer IDs that can be parsed
    const validIds = teamData.every(team => {
      const id = parseInt(team.id, 10);
      return !isNaN(id) && id > 0;
    });
    
    if (!validIds) {
      throw new Error('Some teams have invalid IDs that cannot be used in database');
    }
    
    // Check if all positions are valid
    const validPositions = teamData.every(team => 
      typeof team.position === 'number' && 
      team.position >= 1 && 
      team.position <= teamData.length
    );
    
    if (!validPositions) {
      throw new Error('Some teams have invalid positions');
    }
    
    console.log('✓ All team IDs and positions are valid for database updates');
    
    // Final success message
    console.log('\n✓✓✓ TEST PASSED: Premier League API returned valid and usable data');
    console.log(`✓✓✓ ${teamData.length} teams with valid standings data ready for database updates`);
    
    return { 
      success: true, 
      teamCount: teamData.length,
      sampleTeams: teamData.slice(0, 5) // Just return the top 5 teams for brevity
    };
    
  } catch (error) {
    console.error('\n✗✗✗ TEST FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the test
testPremierLeagueApi()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
