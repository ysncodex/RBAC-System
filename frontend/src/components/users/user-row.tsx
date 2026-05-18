'use client';

import React, { memo, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { User } from '@/types/user';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataCard } from '@/components/shared/data-card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { banUser, reactivateUser, suspendUser } from '@/services/users.service';
import { getApiErrorMessage } from '@/services/auth';
import { useAuthStore, selectUser, selectUserPermissions } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface UserRowProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  variant?: 'row' | 'card';
}

function useUserActions(user: User, onEdit?: (user: User) => void, onDelete?: (user: User) => void) {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(selectUser);
  const permissions = useAuthStore(selectUserPermissions);
  const permSet = useMemo(() => new Set(permissions), [permissions]);

  const isSelf = currentUser?.id === user.id;

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['users'] });

  const suspendMut = useMutation({
    mutationFn: () => suspendUser(user.id),
    onSuccess: () => {
      toast.success('User suspended');
      invalidate();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const banMut = useMutation({
    mutationFn: () => banUser(user.id),
    onSuccess: () => {
      toast.success('User banned');
      invalidate();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const reactivateMut = useMutation({
    mutationFn: () => reactivateUser(user.id),
    onSuccess: () => {
      toast.success('User reactivated');
      invalidate();
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });

  const busy = suspendMut.isPending || banMut.isPending || reactivateMut.isPending;

  const showSuspend = !isSelf && user.status === 'ACTIVE' && permSet.has('users.suspend');
  const showBan =
    !isSelf &&
    (user.status === 'ACTIVE' || user.status === 'SUSPENDED') &&
    permSet.has('users.ban');
  const showReactivate = !isSelf && user.status !== 'ACTIVE' && permSet.has('users.reactivate');
  const showDelete = !isSelf && permSet.has('users.delete') && onDelete;
  const showEdit = permSet.has('users.edit') && onEdit;
  const showMenu = showEdit || showSuspend || showBan || showReactivate || showDelete;

  return {
    busy,
    showMenu,
    showEdit,
    showSuspend,
    showBan,
    showReactivate,
    showDelete,
    suspendMut,
    banMut,
    reactivateMut,
    onEdit,
    onDelete,
    user,
  };
}

function UserAvatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      aria-hidden
    >
      {name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || '?'}
    </span>
  );
}

function UserActionsMenu({
  actions,
}: {
  actions: ReturnType<typeof useUserActions>;
}) {
  const {
    busy,
    showMenu,
    showEdit,
    showSuspend,
    showBan,
    showReactivate,
    showDelete,
    suspendMut,
    banMut,
    reactivateMut,
    onEdit,
    onDelete,
    user,
  } = actions;

  if (!showMenu) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="User actions" disabled={busy}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showEdit && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onEdit?.(user);
            }}
          >
            Edit
          </DropdownMenuItem>
        )}
        {showSuspend && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              suspendMut.mutate();
            }}
          >
            Suspend
          </DropdownMenuItem>
        )}
        {showBan && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              banMut.mutate();
            }}
          >
            Ban
          </DropdownMenuItem>
        )}
        {showReactivate && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              reactivateMut.mutate();
            }}
          >
            Reactivate
          </DropdownMenuItem>
        )}
        {showDelete && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              onDelete?.(user);
            }}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const UserRow = memo(function UserRow({
  user,
  onEdit,
  onDelete,
  variant = 'row',
}: UserRowProps) {
  const actions = useUserActions(user, onEdit, onDelete);

  if (variant === 'card') {
    return (
      <DataCard
        header={
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar name={user.name} />
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <UserActionsMenu actions={actions} />
          </div>
        }
        fields={[
          {
            label: 'Role',
            value: (
              <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {user.role.name}
              </span>
            ),
          },
          {
            label: 'Status',
            value: <StatusBadge status={user.status} />,
          },
        ]}
      />
    );
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={user.name} />
          <span className="block min-w-0 truncate font-medium" title={user.name}>
            {user.name}
          </span>
        </div>
      </td>
      <td className="max-w-[200px] px-4 py-3">
        <span className="block truncate text-muted-foreground" title={user.email}>
          {user.email}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
          {user.role.name}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className={cn('px-4 py-3 text-right')}>
        <UserActionsMenu actions={actions} />
      </td>
    </tr>
  );
});
