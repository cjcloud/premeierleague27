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
import { deleteUser } from '@/app/admin/actions';

interface DeleteUserDialogProps {
  userId: number;
  userName: string;
}

export function DeleteUserDialog({ userId, userName }: DeleteUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    setError(null);
    setSubmitting(true);
    const result = await deleteUser(userId);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {userName}?</DialogTitle>
          <DialogDescription>
            This permanently removes {userName} and any predictions they have made. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
