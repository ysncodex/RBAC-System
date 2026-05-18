'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthReadyForApi } from '@/hooks/useAuthReadyForApi';
import { getApiErrorMessage } from '@/services/auth';
import { getRoles } from '@/services/permissions.service';
import { updateUser } from '@/services/users.service';
import { useAuthStore, selectUser, selectUserPermissions } from '@/store/auth.store';
import type { User } from '@/types/user';

const baseSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.email({ message: 'Enter a valid email address' }),
  roleId: z.string().min(1, 'Select a role'),
});

type BaseFormValues = z.infer<typeof baseSchema>;

interface Props {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({ user, open, onOpenChange }: Props) {
  const authReady = useAuthReadyForApi();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(selectUser);
  const actorPermissions = useAuthStore(selectUserPermissions);
  const hasViewAll = actorPermissions.includes('users.view_all');

  const { data: roles = [], isLoading: rolesQueryLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: open && authReady,
    staleTime: 1000 * 60 * 5,
  });

  const rolesLoading = open && (!authReady || rolesQueryLoading);
  const isSelf = Boolean(user && currentUser?.id === user.id);

  const visibleRoles = React.useMemo(() => {
    if (hasViewAll) return roles;
    const base = roles.filter((r) => r.slug === 'agent' || r.slug === 'customer');
    if (user && !base.some((r) => r.id === user.role.id)) {
      const current = roles.find((r) => r.id === user.role.id);
      if (current) return [...base, current];
    }
    return base;
  }, [roles, hasViewAll, user]);

  const form = useForm<BaseFormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: { name: '', email: '', roleId: '' },
  });

  React.useEffect(() => {
    if (!user || !open) return;
    form.reset({
      name: user.name,
      email: user.email,
      roleId: user.role.id,
    });
  }, [user, open, form]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({ name: '', email: '', roleId: '' });
    }
    onOpenChange(next);
  }

  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; roleId?: string }) => {
      if (!user) throw new Error('No user');
      return updateUser(user.id, payload);
    },
    onSuccess: async () => {
      toast.success('User updated');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      handleOpenChange(false);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  function onSubmit(values: BaseFormValues) {
    if (!user) return;

    updateMutation.mutate(
      isSelf
        ? { name: values.name, email: values.email }
        : { name: values.name, email: values.email, roleId: values.roleId }
    );
  }

  const busy = updateMutation.isPending || rolesLoading;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription className="text-pretty break-words">
            Update profile and role. Changes are saved to the server immediately.
            {isSelf && (
              <span className="mt-2 block text-xs text-muted-foreground">
                You cannot change your own role here; sign in again after an admin updates your
                account for changes to take effect in your session.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="edit-user-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="edit-user-name"
              {...form.register('name')}
              autoComplete="name"
              disabled={busy}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="edit-user-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="edit-user-email"
              type="email"
              {...form.register('email')}
              autoComplete="email"
              disabled={busy}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Role</span>
            <Controller
              name="roleId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isSelf || busy}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={rolesLoading ? 'Loading roles…' : 'Select a role'} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-w-[min(calc(100vw-2rem),var(--radix-select-trigger-width))]">
                    {visibleRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="truncate">{r.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.roleId && (
              <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
