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
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <LastUpdatedIndicator timestamp={lastUpdatedTimestamp} />
        </div>
        <RefreshStandingsButton />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">Manage Users</h2>
        <UserFormDialog mode="add" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableCaption className="px-4 pb-4">
            Users log in with their access code. Set and change codes here — no passwords.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[56px] px-2 sm:px-4">ID</TableHead>
              <TableHead className="px-2 sm:px-4">Name</TableHead>
              <TableHead className="px-2 sm:px-4">Access Code</TableHead>
              <TableHead className="px-2 sm:px-4">Admin</TableHead>
              <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium px-2 sm:px-4">{user.id}</TableCell>
                <TableCell className="px-2 sm:px-4">{user.name}</TableCell>
                <TableCell className="font-mono text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
                  {user.accessCode}
                </TableCell>
                <TableCell className="px-2 sm:px-4">{user.isAdmin ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right px-2 sm:px-4">
                  <div className="flex justify-end gap-2 flex-wrap">
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
    </div>
  );
}
