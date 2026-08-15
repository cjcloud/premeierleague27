/**
 * Test script to verify the team standings update logic
 * Tests both conditions:
 * 1. When data is stale (>3 minutes old) - should trigger update
 * 2. When data is fresh (<3 minutes old) - should skip update
 */

import { db } from '@/db';
import { teams } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { shouldUpdateStandings, updateTeamStandings } from '@/lib/api';

// Main test function
async function testUpdateLogic() {
  console.log('=== Testing Premier League API Update Logic ===');
  console.log(`Test time: ${new Date().toISOString()}`);

  try {
    // Step 1: Check current update status
    console.log('\n[Test 1] Checking if update is needed based on current data age...');
    const initialUpdateNeeded = await shouldUpdateStandings();
    console.log(`Initial check - Update needed: ${initialUpdateNeeded}`);

    if (initialUpdateNeeded) {
      // If update is needed, perform it
      console.log('\nData is stale, updating team standings...');
      const updateResult = await updateTeamStandings();
      console.log('Update result:', updateResult);
      
      // After updating, check again - should now return false (no update needed)
      console.log('\n[Test 2] Checking if update is still needed after refresh...');
      const afterUpdateNeeded = await shouldUpdateStandings();
      console.log(`After update check - Update needed: ${afterUpdateNeeded}`);
      
      if (!afterUpdateNeeded) {
        console.log('\n✓ PASS: Fresh data correctly identified as not needing update');
      } else {
        console.log('\n✗ FAIL: Fresh data incorrectly identified as needing update');
      }
    } else {
      // If no update is needed, manually set an old timestamp to force an update
      console.log('\nData is fresh. To test update logic, setting a team with old timestamp...');
      
      // Get a team to modify
      const teamResult = await db.select().from(teams).limit(1);
      if (teamResult.length === 0) {
        throw new Error('No teams found in database');
      }
      
      const teamId = teamResult[0].id;
      
      // Set timestamp to 5 minutes ago to force update
      const oldDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      await db
        .update(teams)
        .set({ lastUpdated: oldDate })
        .where(eq(teams.id, teamId));
        
      console.log(`Modified timestamp for team ID ${teamId} to ${oldDate.toISOString()}`);
      
      // Check again - should now return true (update needed)
      console.log('\n[Test 2] Checking if update is needed after setting old timestamp...');
      const afterModificationNeeded = await shouldUpdateStandings();
      console.log(`After modification check - Update needed: ${afterModificationNeeded}`);
      
      if (afterModificationNeeded) {
        console.log('\n✓ PASS: Stale data correctly identified as needing update');
        
        // Now update and check again
        console.log('\nUpdating team standings...');
        const updateResult = await updateTeamStandings();
        console.log('Update result:', updateResult);
        
        // Final check - should return false (no update needed)
        console.log('\n[Test 3] Final check after update...');
        const finalCheckNeeded = await shouldUpdateStandings();
        console.log(`Final check - Update needed: ${finalCheckNeeded}`);
        
        if (!finalCheckNeeded) {
          console.log('\n✓ PASS: After update, data correctly identified as not needing update');
        } else {
          console.log('\n✗ FAIL: After update, data incorrectly identified as needing update');
        }
      } else {
        console.log('\n✗ FAIL: Stale data incorrectly identified as not needing update');
      }
    }

    // Check the timestamps in the database
    console.log('\nCurrent timestamps in database:');
    const allTeams = await db.select({ id: teams.id, name: teams.name, lastUpdated: teams.lastUpdated }).from(teams).limit(5);
    
    allTeams.forEach(team => {
      console.log(`Team ${team.id} (${team.name}): ${team.lastUpdated?.toISOString() || 'null'}`);
    });
    
    console.log('\n=== Test complete ===');
    return { success: true };
    
  } catch (error) {
    console.error('Test failed with error:', error);
    return { success: false, error };
  }
}

// Run the test
testUpdateLogic()
  .then(result => {
    if (result.success) {
      console.log('\nAll tests completed successfully!');
      process.exit(0);
    } else {
      console.error('\nTest failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
