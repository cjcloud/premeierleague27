/**
 * Minimal Premier League API Test
 * A simple, dependency-free test for the Premier League API
 */

// API URL from the application
const API_URL = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false';

// Run the API test
console.log('=== Premier League API Test ===');
console.log(`Test time: ${new Date().toLocaleString()}`);
console.log(`API URL: ${API_URL}`);
console.log('\nSending API request...');

fetch(API_URL, {
  headers: {
    'Origin': 'https://www.premierleague.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  },
})
  .then(response => {
    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response type: ${response.headers.get('content-type')}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return response.json();
  })
  .then(data => {
    console.log('\nAPI Response validated:');
    
    // Basic validation
    if (!data || !data.tables || !Array.isArray(data.tables) || !data.tables[0]) {
      console.log('❌ Response missing expected structure');
      process.exit(1);
    }
    
    const entries = data.tables[0].entries;
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      console.log('❌ No team data found in response');
      process.exit(1);
    }
    
    console.log(`✅ Found ${entries.length} teams in the standings`);
    
    // Display top 5 teams
    console.log('\nTop 5 teams:');
    entries
      .sort((a, b) => a.overall.position - b.overall.position)
      .slice(0, 5)
      .forEach(entry => {
        console.log(`${entry.overall.position}. ${entry.team.name} - ${entry.overall.points} points`);
      });
    
    console.log('\n✅ TEST PASSED: API returned valid and usable data');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
