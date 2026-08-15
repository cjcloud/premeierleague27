/**
 * Simple Premier League API Test
 * This script makes a basic API call to test if the Premier League API returns usable data
 */

// Basic API call test
async function testPremierLeagueApi() {
  // API URL from the application
  const API_URL = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings?live=false';
  
  console.log('Starting simple Premier League API test...');
  console.log(`Test time: ${new Date().toISOString()}`);
  console.log(`API URL: ${API_URL}`);
  
  try {
    console.log('Sending API request...');
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
    
    // Basic validation
    if (!data.tables || !Array.isArray(data.tables) || !data.tables[0]?.entries) {
      console.error('❌ API response missing required data structure');
      return { success: false, error: 'Invalid data structure' };
    }
    
    const entries = data.tables[0].entries;
    console.log(`\nFound ${entries.length} teams in the standings.`);
    
    // Print top 5 teams if available
    if (entries.length > 0) {
      console.log('\nTop 5 teams (or as many as available):');
      entries
        .sort((a: { overall: { position: number } }, b: { overall: { position: number } }) => a.overall.position - b.overall.position)
        .slice(0, Math.min(5, entries.length))
        .forEach((entry: { overall: { position: number, points: number }, team: { name: string } }) => {
          console.log(`${entry.overall.position}. ${entry.team.name} - ${entry.overall.points} points`);
        });
    }
    
    console.log('\n✅ Test completed successfully - API returned usable data');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    };
  }
}

// Run the test
testPremierLeagueApi()
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('❌ Unexpected error running test:', err);
    process.exit(1);
  });
