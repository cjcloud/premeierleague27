/**
 * Robust Premier League API Test
 * This script tests the Premier League API and validates the response
 * Using plain JS instead of TypeScript for maximum compatibility
 */

// API URL from the application
const API_URL = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false';

// Main test function using plain JS
async function testPremierLeagueApi() {
  console.log('=== Premier League API Test ===');
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
    const data = await response.json();
    
    // Save the response to a variable for inspection
    const responseData = data;
    
    // Validate the response structure
    const validationResults = validateResponse(responseData);
    
    if (validationResults.valid) {
      console.log('\n✅ API response is valid and contains usable data');
      
      // Show some sample data
      displaySampleData(responseData);
      
      return { 
        success: true, 
        message: 'API test passed successfully',
        data: responseData
      };
    } else {
      console.error('\n❌ API response validation failed:');
      validationResults.issues.forEach(issue => console.error(` - ${issue}`));
      
      return { 
        success: false, 
        error: 'API data validation failed',
        issues: validationResults.issues,
        data: responseData
      };
    }
    
  } catch (error) {
    console.error('\n❌ API test failed:');
    console.error(` - ${error.message || 'Unknown error'}`);
    
    return { 
      success: false, 
      error: error.message || 'Unknown error'
    };
  }
}

// Function to validate the API response
function validateResponse(data) {
  const issues = [];
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    issues.push('Response is not a valid object');
    return { valid: false, issues };
  }
  
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
  
  // Check if we have teams (Premier League has 20 teams)
  if (entries.length === 0) {
    issues.push('No teams found in the standings');
    return { valid: false, issues };
  }
  
  if (entries.length !== 20) {
    issues.push(`Expected 20 teams, found ${entries.length}`);
    // Don't return yet, this is just a warning
  }
  
  // Check a random team entry to verify structure
  const sampleTeam = entries[0];
  if (!sampleTeam.team || !sampleTeam.team.id || !sampleTeam.team.name) {
    issues.push('Team data is missing required properties (id, name)');
  }
  
  if (!sampleTeam.overall || typeof sampleTeam.overall.position !== 'number') {
    issues.push('Team position data is missing or invalid');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Display sample data from the API response
function displaySampleData(data) {
  try {
    const entries = data.tables[0].entries;
    console.log(`\nFound ${entries.length} teams in the standings.`);
    
    console.log('\nTop 5 teams (or as many as available):');
    entries
      .sort((a, b) => a.overall.position - b.overall.position)
      .slice(0, Math.min(5, entries.length))
      .forEach(entry => {
        console.log(`${entry.overall.position}. ${entry.team.name} - ${entry.overall.points} points`);
      });
    
    console.log('\nSample team data structure:');
    const sampleTeam = entries[0];
    console.log(`- Team ID: ${sampleTeam.team.id}`);
    console.log(`- Team Name: ${sampleTeam.team.name}`);
    console.log(`- Position: ${sampleTeam.overall.position}`);
    console.log(`- Points: ${sampleTeam.overall.points}`);
    console.log(`- Games Played: ${sampleTeam.overall.played}`);
    console.log(`- Won/Drawn/Lost: ${sampleTeam.overall.won}/${sampleTeam.overall.drawn}/${sampleTeam.overall.lost}`);
    console.log(`- Goals For/Against: ${sampleTeam.overall.goalsFor}/${sampleTeam.overall.goalsAgainst}`);
  } catch (error) {
    console.error('Error displaying sample data:', error.message);
  }
}

// Run the test
testPremierLeagueApi()
  .then(result => {
    if (result.success) {
      console.log('\n✅ API TEST PASSED: The Premier League API returned usable data');
      process.exit(0);
    } else {
      console.error('\n❌ API TEST FAILED:', result.error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\n❌ UNEXPECTED TEST ERROR:', err);
    process.exit(1);
  });
