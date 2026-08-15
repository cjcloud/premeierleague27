'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Team } from '@/db/schema';
import { submitPredictions } from '@/app/predictions/actions';
import Image from 'next/image';

interface PredictionFormProps {
  teams: Team[];
  initialPredictions: {
    teamId: number;
    predictedPosition: number;
  }[];
  isDisabled?: boolean;
  deadline?: string;
}

export function PredictionForm({ teams, initialPredictions, isDisabled = false, deadline }: PredictionFormProps) {
  const router = useRouter();
  const hasExistingPredictions = initialPredictions && initialPredictions.length > 0;
  const [predictions, setPredictions] = useState<Record<number, string>>(() => {
    if (!initialPredictions) return {};
    return initialPredictions.reduce((acc, p) => {
      acc[p.teamId] = p.predictedPosition.toString();
      return acc;
    }, {} as Record<number, string>);
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedTeams, setDisplayedTeams] = useState<Team[]>(teams);

  useEffect(() => {
    setDisplayedTeams(teams);
  }, [teams]);

  useEffect(() => {
    const initialData = initialPredictions.reduce((acc, p) => {
      acc[p.teamId] = String(p.predictedPosition);
      return acc;
    }, {} as Record<number, string>);
    setPredictions(initialData);
    validatePredictions(initialData);
  }, [initialPredictions]);

  const validatePredictions = (currentPredictions: Record<number, string>) => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<number, string | null> = {};
    const seenPositions = new Map<string, number>();

    // Check for out-of-range values first
    for (const [teamId, positionStr] of Object.entries(currentPredictions)) {
      if (positionStr === '') continue;
      const position = parseInt(positionStr, 10);
      if (isNaN(position) || position < 1 || position > 20) {
        newFieldErrors[parseInt(teamId, 10)] = 'Must be 1-20';
      }
    }

    // Check for duplicates
    for (const [teamId, positionStr] of Object.entries(currentPredictions)) {
      if (positionStr === '') continue;
      if (seenPositions.has(positionStr)) {
        const firstTeamId = seenPositions.get(positionStr)!;
        newFieldErrors[parseInt(teamId, 10)] = 'Position already chosen!';
        newFieldErrors[firstTeamId] = 'Position already chosen!';
      } else {
        seenPositions.set(positionStr, parseInt(teamId, 10));
      }
    }

    setFieldErrors(newFieldErrors);

    // Create summary errors for the bottom section
    const hasDuplicates = Object.values(newFieldErrors).some(e => e === 'Position already chosen!');
    const hasRangeErrors = Object.values(newFieldErrors).some(e => e === 'Must be 1-20');

    if (hasDuplicates) newErrors.push('All positions must be unique.');
    if (hasRangeErrors) newErrors.push('All positions must be between 1 and 20.');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleInputChange = (teamId: number, value: string) => {
    const newPredictions = {
      ...predictions,
      [teamId]: value,
    };
    setPredictions(newPredictions);
    validatePredictions(newPredictions);
  };

  const handleSort = () => {
    const sortedTeams = [...displayedTeams].sort((a, b) => {
      const posA = parseInt(predictions[a.id], 10);
      const posB = parseInt(predictions[b.id], 10);

      if (!isNaN(posA) && !isNaN(posB)) {
        return posA - posB;
      }
      if (!isNaN(posA)) {
        return -1;
      }
      if (!isNaN(posB)) {
        return 1;
      }
      return 0;
    });
    setDisplayedTeams(sortedTeams);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validatePredictions(predictions)) {
      return;
    }
    setIsSubmitting(true);

    const predictionsToSubmit = Object.entries(predictions)
      .map(([teamId, position]) => ({
        teamId: parseInt(teamId, 10),
        position: parseInt(position, 10),
      }))
      .filter(p => !isNaN(p.position));

    try {
      await submitPredictions(predictionsToSubmit);
      toast.success('Predictions submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit predictions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Your Predictions</h2>
        <p className="text-muted-foreground">
          {hasExistingPredictions
            ? 'Edit your predicted final positions...'
            : 'Enter your predicted final position (1-20) for each team.'}
        </p>
      </div>
      <div className="mb-6 flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting || errors.length > 0 || isDisabled} className="w-full sm:w-auto">
          {isSubmitting ? 'Submitting...' : 'Submit Predictions'}
        </Button>
        <Button type="button" onClick={handleSort} variant="outline" disabled={isDisabled} className="w-full sm:w-auto">
          Sort by Prediction
        </Button>
      </div>
      {deadline && !isDisabled && (
        <p className="text-amber-600 dark:text-amber-400 text-xs mb-4">
          Submissions close: {deadline}
        </p>
      )}
      <div className="border dark:border-gray-700 rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] md:w-auto">Team</TableHead>
              <TableHead>Predicted Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedTeams.map((team, index) => (
              <TableRow key={team.id} className={index % 2 === 0 ? 'bg-slate-300 dark:bg-gray-900' : 'bg-slate-200 dark:bg-gray-800'}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Image src={`/images/${team.abbr}.svg`} alt={`${team.name} logo`} width={24} height={24} className="w-6 h-6" />
                    <div>
                      <span className="hidden md:inline">{team.name}</span>
                      <span className="md:hidden">{team.abbr || team.name}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      className={`w-24 ${fieldErrors[team.id] ? 'border-red-500' : ''} ${isDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                      value={predictions[team.id] || ''}
                      onChange={(e) => handleInputChange(team.id, e.target.value)}
                      required
                      disabled={isDisabled}
                    />
                    {fieldErrors[team.id] && (
                      <span className="text-red-500 text-sm font-medium">{fieldErrors[team.id]}</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-6">
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isSubmitting || errors.length > 0 || isDisabled} className="w-full sm:w-auto">
            {isSubmitting ? 'Submitting...' : 'Submit Predictions'}
          </Button>
          <Button type="button" onClick={handleSort} variant="outline" disabled={isDisabled} className="w-full sm:w-auto">
            Sort by Prediction
          </Button>
        </div>
        {errors.length > 0 && (
          <div className="mt-4 text-red-500">
            <h3 className="font-bold">Please fix the following errors:</h3>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
}
