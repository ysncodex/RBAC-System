'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useUsers } from '@/hooks/queries/useUsers';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { DataTable } from '@/components/shared/data-table';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/shared/permission-gate';
import { UserRow } from '@/components/users/user-row';
import type { User } from '@/types/user';
import { useAuthStore, selectUserPermissions } from '@/store/auth.store';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteUser } from '@/services/users.service';
import { getApiErrorMessage } from '@/services/auth';

const CreateUserDialog = dynamic(
  () => import('@/components/users/create-user-dialog').then((mod) => mod.CreateUserDialog),
  { ssr: false }
);

const EditUserDialog = dynamic(
  () => import('@/components/users/edit-user-dialog').then((mod) => mod.EditUserDialog),
  { ssr: false }
);

export default function UsersPage() {
  const queryClient = useQueryClient();
  const permissions = useAuthStore(selectUserPermissions);
  const seesFullDirectory = permissions.includes('users.view_all');
  const { data: users = [], isLoading } = useUsers();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      setUserToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description={
          seesFullDirectory
            ? 'Manage system users and permissions.'
            : 'Users in your management scope: direct reports and their nested teams.'
        }
        action={
          <PermissionGate permission="users.create">
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </PermissionGate>
        }
      />

      {createOpen && <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />}

      {editingUser !== null && (
        <EditUserDialog
          user={editingUser}
          open={editingUser !== null}
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
        />
      )}

      <AlertDialog
        open={userToDelete !== null}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{userToDelete?.name}</strong> ({userToDelete?.email})
              from the system. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (userToDelete) deleteMut.mutate(userToDelete.id);
              }}
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SectionCard title="Users List">
        {isLoading ? (
          <LoadingSpinner />
        ) : users.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              title={seesFullDirectory ? 'No users found' : 'No users in your scope yet'}
              description={
                seesFullDirectory
                  ? 'Create your first user.'
                  : 'Create agents or customers to build your team. They will appear here once assigned under your management chain.'
              }
            />
            {!seesFullDirectory ? (
              <div className="flex justify-center">
                <PermissionGate permission="users.create">
                  <Button type="button" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add team member
                  </Button>
                </PermissionGate>
              </div>
            ) : null}
          </div>
        ) : (
          <DataTable>
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="w-12 px-4 py-3 text-right" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={setEditingUser}
                    onDelete={setUserToDelete}
                  />
                ))}
              </tbody>
            </table>
          </DataTable>
        )}
      </SectionCard>

      {!seesFullDirectory ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Need permission overrides for an agent? Open{' '}
          <Link
            href="/permissions"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Permissions
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
