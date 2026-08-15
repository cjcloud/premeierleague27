import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { teams, predictions } from '@/db/schema';
import { PredictionForm } from '@/components/prediction-form';
import { eq } from 'drizzle-orm';
import { isPredictionDeadlinePassed, getFormattedDeadline } from '@/lib/time-utils';

export default async function PredictionsPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.id) {
    redirect('/login');
  }

  const allTeams = await db.query.teams.findMany();
  const userPredictions = await db.query.predictions.findMany({
    where: eq(predictions.userId, session.id),
  });

  // Check if the deadline has passed
  const deadlinePassed = isPredictionDeadlinePassed();
  const formattedDeadline = getFormattedDeadline();

  return (
    <div className="container mx-auto py-10">
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">Welcome, {session.name}!</p>
      {deadlinePassed ? (
        <div className="relative">
          <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center rounded-lg">
            <div className="bg-red-800/80 p-8 rounded-lg max-w-md text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Predictions Now Closed</h2>
              <p className="text-white">The deadline for submitting predictions has passed.</p>
            </div>
          </div>
          <PredictionForm 
            teams={allTeams} 
            initialPredictions={userPredictions} 
            isDisabled={deadlinePassed}
            deadline={formattedDeadline} 
          />
        </div>
      ) : (
        <>
          {/* <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold mb-4">
            Deadline: {formattedDeadline}
          </p> */}
          <PredictionForm 
            teams={allTeams} 
            initialPredictions={userPredictions} 
            isDisabled={deadlinePassed}
            deadline={formattedDeadline} 
          />
        </>
      )}
    </div>
  );
}
