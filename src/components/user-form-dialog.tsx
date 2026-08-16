'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addUser, updateUser } from '@/app/admin/actions';

interface ExistingUser {
  id: number;
  name: string;
  accessCode: string;
  isAdmin: number;
}

interface UserFormDialogProps {
  mode: 'add' | 'edit';
  user?: ExistingUser;
}

// Generate a readable, reasonably strong access code (avoids ambiguous chars).
function generateAccessCode(length = 10): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const symbols = '!@#$%&*';
  const pick = (set: string, n: number) => {
    const out: string[] = [];
    const values = new Uint32Array(n);
    crypto.getRandomValues(values);
    for (let i = 0; i < n; i++) out.push(set[values[i] % set.length]);
    return out.join('');
  };
  // length-1 alphanumerics plus one symbol, symbol placed in the middle-ish.
  const body = pick(charset, length - 1);
  const sym = pick(symbols, 1);
  const at = Math.floor(body.length / 2);
  return body.slice(0, at) + sym + body.slice(at);
}

export function UserFormDialog({ mode, user }: UserFormDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [accessCode, setAccessCode] = useState(user?.accessCode ?? '');
  const [isAdmin, setIsAdmin] = useState<boolean>(user?.isAdmin === 1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isAdd = mode === 'add';

  const resetForm = () => {
    setName(user?.name ?? '');
    setAccessCode(user?.accessCode ?? '');
    setIsAdmin(user?.isAdmin === 1);
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = { name, accessCode, isAdmin };
    const result =
      isAdd || !user
        ? await addUser(payload)
        : await updateUser(user.id, payload);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      if (isAdd) resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isAdd ? (
          <Button>Add user</Button>
        ) : (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isAdd ? 'Add user' : `Edit ${user?.name}`}</DialogTitle>
          <DialogDescription>
            {isAdd
              ? 'Create a new user and set their access code.'
              : 'Update this user’s name, access code, or admin status.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-name" className="text-right">
                Name
              </Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-code" className="text-right">
                Access code
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="user-code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setAccessCode(generateAccessCode())}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right text-sm font-medium">Admin</span>
              <label className="col-span-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                Can manage users and refresh standings
              </label>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isAdd ? 'Add user' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
