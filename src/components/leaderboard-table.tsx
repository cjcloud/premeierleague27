'use client';

import React from 'react';
import Image from 'next/image';

// Helper function to get cell background color class based on prediction accuracy and bonus points
const getCellColorClass = (predicted: number | undefined | null, actual: number | null, points: number) => {
  // Check if we have valid numbers to compare
  if (predicted === undefined || predicted === null || actual === null) {
    return '';
  }
  
  // Force conversion to numbers
  const predNum = Number(predicted);
  const actNum = Number(actual);
  
  if (predNum === actNum) {
    return 'bg-green-400 dark:bg-green-600'; // Green for exact match
  }
  
  if (Math.abs(predNum - actNum) === 1) {
    return 'bg-yellow-400 dark:bg-yellow-600'; // Yellow for off by one
  }
  
  // Check for bonus points (not a hit or near miss but still got a point)
  if (points > 0 && Math.abs(predNum - actNum) > 1) {
    return 'bg-red-200 dark:bg-red-400'; // Light red for bonus points
  }
  
  return 'bg-red-400 dark:bg-red-600'; // Red for more than one off with no bonus points
};

// We're not using this function anymore since we're coloring based on prediction accuracy
// directly in both cells rather than points value
// const getPointsColorClass = (points: number) => {
//   if (points === 3) {
//     return 'bg-green-400 dark:bg-green-600'; // Green for exact match (3 points)
//   }
//   if (points === 1) {
//     return 'bg-yellow-400 dark:bg-yellow-600'; // Yellow for near miss (1 point)
//   }
//   return 'bg-red-400 dark:bg-red-600'; // Red for all other cases (0 points)
// };

// Define types for props
type Team = {
  id: number;
  name: string;
  abbr: string | null;
  actualPosition: number | null;
  points: number | null;
};

type UserScore = {
  id: number;
  name: string;
  points: number;
  predictions: Record<number | string, number | null>;
};

type LeaderboardTableProps = {
  teams: Team[];
  users: UserScore[];
};

export default function LeaderboardTable({ teams, users }: LeaderboardTableProps) {
  // Sort teams by actual position
  const sortedTeams = [...teams].sort((a, b) => (a.actualPosition ?? 99) - (b.actualPosition ?? 99));
  
  // Sort users by points (already done on server)
  const sortedUsers = users;

  return (
    <div className="w-full overflow-auto">
      <div className="max-w-[840px] mx-auto">
        {/* Color Legend - One line with responsive sizing */}
        <div className="mb-4 flex justify-center overflow-x-auto whitespace-nowrap py-1">
          <div className="flex items-center space-x-3 md:space-x-4 text-[8px] xs:text-[9px] sm:text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 dark:bg-green-600"></div>
              <span>Correct</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 dark:bg-yellow-600"></div>
              <span>Near Miss (±1)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-400"></div>
              <span>Bonus Point Only</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 dark:bg-red-600"></div>
              <span>Incorrect</span>
            </div>
          </div>
        </div>
        
        <table className="w-full text-[10px] xs:text-xs sm:text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md table-auto">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
              <th rowSpan={2} className="text-center py-1 sm:py-2 px-0 sm:px-1 text-xs sm:text-base font-semibold align-middle w-8">Pos</th>
              <th rowSpan={2} className="text-left py-1 sm:py-2 px-1 sm:px-2 pl-7 text-xs sm:text-base font-semibold align-middle w-40 sm:w-60">Team</th>
              <th rowSpan={2} className="text-center py-1 sm:py-2 px-0 sm:px-1 text-xs sm:text-base font-semibold align-middle w-8">Prem Pts</th>
              {sortedUsers.map(user => (
                <th key={user.id} colSpan={2} className="text-center py-1 sm:py-2 px-1 sm:px-2 text-xs sm:text-base font-semibold border-l-2 border-gray-200 dark:border-gray-600">{user.name}</th>
              ))}
            </tr>
            <tr className="bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
              {sortedUsers.map(user => (
                <React.Fragment key={user.id}>
                  <th className="text-center py-0 sm:py-1 px-0 font-semibold text-[10px] sm:text-xs border-l-2 border-gray-200 dark:border-gray-600 w-8">Prd</th>
                  <th className="text-center py-0 sm:py-1 px-0 font-semibold text-[10px] sm:text-xs border-l border-gray-200 dark:border-gray-700 w-8">Pts</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTeams.map((team, index) => (
              <tr key={team.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'} border-b dark:border-gray-700`}>
                {/* Current Position Column - Explicitly display with fallback */}
                <td className="text-center py-1 sm:py-2 px-0 sm:px-1 font-bold text-xs sm:text-base w-8">
                  {typeof team.actualPosition === 'number' ? team.actualPosition : '-'}
                </td>
                <td className="py-0 sm:py-1 px-1 sm:px-2 pl-7 w-40 sm:w-60">
                  <div className="flex items-center h-6 sm:h-7">
                    <div className="flex-none w-5 h-5 flex justify-center">
                      {team.abbr && (
                        <Image 
                          src={`/images/${team.abbr}.svg`} 
                          alt={`${team.abbr || 'Team'} logo`} 
                          width={20} 
                          height={20}
                          loading="eager"
                          priority={team.actualPosition !== null && team.actualPosition <= 5}
                          className="w-5 h-5"
                        />
                      )}
                    </div>
                    <span className="font-semibold hidden sm:inline ml-2 pl-1">{team.name}</span>
                    <span className="font-semibold inline sm:hidden ml-2 pl-1">{team.abbr || team.name?.substring(0,3)}</span>
                  </div>
                </td>
                <td className="bg-gray-100 dark:bg-gray-800 text-center text-muted-foreground py-1 sm:py-2 px-0 sm:px-1 font-bold text-[11px] sm:text-sm w-8">
                  {team.points !== null ? team.points : 0}
                </td>
                {sortedUsers.map(user => {
                  const predictedPosition = user.predictions[team.id];
                  // Points are pre-calculated on the server for each prediction
                  const points = user.predictions[`${team.id}_points`] || 0;
                  
                  return (
                    <React.Fragment key={user.id}>
                      <td className={`text-center p-0 border-r border-gray-300/30 font-semibold w-8 ${getCellColorClass(predictedPosition, team.actualPosition, points)}`}>
                        <div className="h-full w-full py-1 px-0 flex items-center justify-center text-[11px] sm:text-sm">
                          {typeof predictedPosition === 'number' ? predictedPosition : '-'}
                        </div>
                      </td>
                      <td className={`text-center p-0 border-gray-300/30 font-semibold w-8 ${getCellColorClass(predictedPosition, team.actualPosition, points)}`}>
                        <div className="h-full w-full py-1 px-0 flex items-center justify-center text-[11px] sm:text-sm">
                          {points}
                        </div>
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-gray-300 dark:bg-gray-700 font-bold">
              <td colSpan={3} className="text-right py-0 px-4">Total Points</td>
              {sortedUsers.map(user => (
                <td key={`${user.id}-total-score`} colSpan={2} className="text-center py-0 px-2 border-l-2 border-slate-100 dark:border-gray-600">
                  {user.points}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
