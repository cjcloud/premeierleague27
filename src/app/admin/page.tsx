import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { EditCodeDialog } from '@/components/edit-code-dialog';
import { RefreshStandingsButton } from '@/components/refresh-standings-button';
import { LastUpdatedIndicator } from '@/components/last-updated-indicator';
import { getLastUpdateTimestamp } from '@/lib/db/queries/teams';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Force dynamic rendering for this admin page
export const dynamic = 'force-dynamic';
// Disable static optimization to ensure this route exists in production
export const dynamicParams = true;

export default async function AdminPage() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.isAdmin) {
    redirect('/');
  }

  const allUsers = await db.select().from(users);
  const lastUpdatedTimestamp = await getLastUpdateTimestamp();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <LastUpdatedIndicator timestamp={lastUpdatedTimestamp} />
        </div>
        <RefreshStandingsButton />
      </div>
      
      <h2 className="text-xl font-bold mb-4">Manage Access Codes</h2>
      <Table>
        <TableCaption>A list of all users and their access codes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Access Code</TableHead>
            <TableHead>Is Admin</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.accessCode}</TableCell>
              <TableCell>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
              <TableCell className="text-right">
                <EditCodeDialog userId={user.id} currentCode={user.accessCode} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
