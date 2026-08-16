import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { users } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { UserFormDialog } from '@/components/user-form-dialog';
import { DeleteUserDialog } from '@/components/delete-user-dialog';
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

  const allUsers = await db.select().from(users).orderBy(asc(users.id));
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

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Manage Users</h2>
        <UserFormDialog mode="add" />
      </div>
      <Table>
        <TableCaption>
          Users log in with their access code. Set and change codes here — no passwords.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Access Code</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.id}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell className="font-mono">{user.accessCode}</TableCell>
              <TableCell>{user.isAdmin ? 'Yes' : 'No'}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <UserFormDialog mode="edit" user={user} />
                  {session.id !== user.id && (
                    <DeleteUserDialog userId={user.id} userName={user.name} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
