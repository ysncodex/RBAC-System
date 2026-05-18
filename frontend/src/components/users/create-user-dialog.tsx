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
import { createUser } from '@/services/users.service';
import { useAuthStore, selectUserPermissions } from '@/store/auth.store';

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: z.string().min(1, 'Select a role'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: Props) {
  const authReady = useAuthReadyForApi();
  const queryClient = useQueryClient();
  const actorPermissions = useAuthStore(selectUserPermissions);
  const hasViewAll = actorPermissions.includes('users.view_all');

  const { data: roles = [], isLoading: rolesQueryLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: open && authReady,
    staleTime: 1000 * 60 * 5,
  });

  const visibleRoles = React.useMemo(() => {
    if (hasViewAll) return roles;
    return roles.filter((r) => r.slug === 'agent' || r.slug === 'customer');
  }, [roles, hasViewAll]);

  const rolesLoading = open && (!authReady || rolesQueryLoading);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: '',
    },
  });

  function resetForm() {
    form.reset({ name: '', email: '', password: '', roleId: '' });
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string; roleId: string }) =>
      createUser(payload),
    onSuccess: async () => {
      toast.success('User created');
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  function onSubmit(values: FormValues) {
    createMutation.mutate(values);
  }

  const busy = createMutation.isPending || rolesLoading;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>Add a new user and assign them a system role.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="create-user-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="create-user-name"
              {...form.register('name')}
              autoComplete="name"
              disabled={busy}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="create-user-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="create-user-email"
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
            <label htmlFor="create-user-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="create-user-password"
              type="password"
              {...form.register('password')}
              autoComplete="new-password"
              disabled={busy}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
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
                  disabled={busy}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={rolesLoading ? 'Loading roles…' : 'Select a role'} />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
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
              {createMutation.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
