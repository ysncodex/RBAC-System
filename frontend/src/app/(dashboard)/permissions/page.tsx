'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { PermissionMatrix, type PermissionRow } from '@/components/permissions/permission-matrix';
import { PermissionGate } from '@/components/shared/permission-gate';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { usePermissions } from '@/hooks/queries/usePermissions';
import { useUsers } from '@/hooks/queries/useUsers';
import { useAuthReadyForApi } from '@/hooks/useAuthReadyForApi';
import type { User } from '@/types/user';
import { getApiErrorMessage } from '@/services/auth';
import {
  assignRolePermissions,
  assignUserPermissions,
  getRolePermissionSlugs,
  getRoles,
} from '@/services/permissions.service';
import { useAuthStore, selectUserPermissions } from '@/store/auth.store';

export default function PermissionsPage() {
  const authReady = useAuthReadyForApi();
  const queryClient = useQueryClient();
  const actorPermissions = useAuthStore(selectUserPermissions);
  const actorPermSet = React.useMemo(() => new Set(actorPermissions), [actorPermissions]);
  const hasViewAll = actorPermSet.has('users.view_all');
  const canEditRoleTemplates = actorPermSet.has('permissions.assign_roles');

  const {
    data: groupedPermissions = {},
    isLoading: permsLoading,
    isError: permsError,
    refetch: refetchPermissions,
  } = usePermissions();
  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useUsers();
  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
    refetch: refetchRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
    enabled: authReady && canEditRoleTemplates,
    staleTime: 1000 * 60 * 5,
  });

  const grantableGrouped = React.useMemo(() => {
    if (hasViewAll) {
      return groupedPermissions;
    }
    const out: Record<string, PermissionRow[]> = {};
    for (const [module, rows] of Object.entries(groupedPermissions)) {
      const filtered = (rows as PermissionRow[]).filter((r) => actorPermSet.has(r.slug));
      if (filtered.length > 0) {
        out[module] = filtered;
      }
    }
    return out;
  }, [groupedPermissions, actorPermSet, hasViewAll]);

  /** Managers assign overrides to agents in their subtree (not full-directory admins). */
  const assignableUsers = React.useMemo(() => {
    if (hasViewAll) return users;
    return users.filter((u) => u.role.slug === 'agent');
  }, [users, hasViewAll]);

  const [tab, setTab] = React.useState<'user' | 'role'>('user');
  const [userId, setUserId] = React.useState('');
  const [roleId, setRoleId] = React.useState('');
  const [userDraft, setUserDraft] = React.useState<string[]>([]);
  const [roleDraft, setRoleDraft] = React.useState<string[] | null>(null);

  const activeTab = !canEditRoleTemplates && tab === 'role' ? 'user' : tab;

  function handleTabChange(value: string) {
    const next = value as 'user' | 'role';
    if (next === 'role' && !canEditRoleTemplates) {
      return;
    }
    setTab(next);
  }

  const {
    data: roleSlugPayload,
    isLoading: roleSlugsLoading,
    isSuccess: roleSlugsSuccess,
  } = useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => getRolePermissionSlugs(roleId),
    enabled: authReady && canEditRoleTemplates && activeTab === 'role' && !!roleId,
  });

  const effectiveRoleSlugs = roleDraft ?? roleSlugPayload?.permissionSlugs ?? [];

  function handleUserSelect(id: string) {
    setUserId(id);
    const u = assignableUsers.find((x) => x.id === id);
    setUserDraft(u?.userPermissions.map((up) => up.permission.slug) ?? []);
  }

  function handleRoleSelect(id: string) {
    setRoleId(id);
    setRoleDraft(null);
  }

  const saveUserMutation = useMutation({
    mutationFn: (vars: { id: string; permissions: string[] }) =>
      assignUserPermissions(vars.id, vars.permissions),
    onSuccess: async () => {
      toast.success('User permission overrides saved');
      await queryClient.refetchQueries({ queryKey: ['users'] });
      const fresh = queryClient.getQueryData<User[]>(['users']);
      const u = fresh?.find((x) => x.id === userId);
      if (u) {
        setUserDraft(u.userPermissions.map((up) => up.permission.slug));
      }
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const saveRoleMutation = useMutation({
    mutationFn: (vars: { id: string; permissions: string[] }) =>
      assignRolePermissions(vars.id, vars.permissions),
    onSuccess: () => {
      toast.success('Role permissions saved');
      void queryClient.invalidateQueries({ queryKey: ['roles'] });
      void queryClient.invalidateQueries({ queryKey: ['role-permissions', roleId] });
      setRoleDraft(null);
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
  });

  const isLoading = permsLoading || usersLoading || (canEditRoleTemplates && rolesLoading);
  const loadError = permsError || usersError || (canEditRoleTemplates && rolesError);

  function handleRetry() {
    void refetchPermissions();
    void refetchUsers();
    if (canEditRoleTemplates) void refetchRoles();
  }

  if (loadError) {
    return (
      <div>
        <PageHeader
          title="Permissions"
          description="Manage role and user permission assignments."
        />
        <SectionCard title="Could not load data">
          <p className="mb-4 text-sm text-destructive">
            Check that the API is running and you are signed in. If the backend was just updated,
            restart it so new modules are registered.
          </p>
          <Button type="button" variant="outline" onClick={handleRetry}>
            Retry
          </Button>
        </SectionCard>
      </div>
    );
  }

  function handleSaveUser() {
    if (!userId) {
      toast.error('Select a user');
      return;
    }
    saveUserMutation.mutate({ id: userId, permissions: userDraft });
  }

  function handleSaveRole() {
    if (!roleId) {
      toast.error('Select a role');
      return;
    }
    saveRoleMutation.mutate({ id: roleId, permissions: effectiveRoleSlugs });
  }

  return (
    <div>
      <PageHeader
        title="Permissions"
        description={
          hasViewAll
            ? 'Assign user-level permission atoms or edit a role default set. Grant ceiling applies: you can only assign permissions you already have.'
            : 'Assign permission atoms to agents in your team. You only see permission toggles you hold yourself (grant ceiling).'
        }
      />

      {!hasViewAll ? (
        <p className="mb-4 text-sm text-muted-foreground">
          User overrides are limited to <strong>agents</strong> in your management scope. Role-wide
          templates require elevated access.
        </p>
      ) : null}

      {!isLoading && !hasViewAll && assignableUsers.length === 0 ? (
        <SectionCard title="No agents in scope">
          <p className="text-sm text-muted-foreground">
            Create or assign agents under your account from the Users page, then return here to tune
            their permission atoms.
          </p>
        </SectionCard>
      ) : null}

      {isLoading ? (
        <LoadingSpinner />
      ) : hasViewAll || assignableUsers.length > 0 ? (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="user">User overrides</TabsTrigger>
            {canEditRoleTemplates ? <TabsTrigger value="role">Role defaults</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="user" className="space-y-4">
            <SectionCard title="User permission overrides">
              <p className="mb-4 text-sm text-muted-foreground">
                These apply on top of the user&apos;s role. Saving replaces all user-level
                permissions shown below.
              </p>
              <div className="mb-4 max-w-md space-y-2">
                <p className="text-sm font-medium">User</p>
                <Select value={userId || undefined} onValueChange={handleUserSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {userId ? (
                <PermissionMatrix
                  permissions={grantableGrouped}
                  selectedPermissions={userDraft}
                  onChange={setUserDraft}
                />
              ) : null}
              <PermissionGate permission="permissions.assign">
                <Button
                  className="mt-4"
                  onClick={handleSaveUser}
                  disabled={!userId || saveUserMutation.isPending}
                >
                  {saveUserMutation.isPending ? 'Saving…' : 'Save user permissions'}
                </Button>
              </PermissionGate>
            </SectionCard>
          </TabsContent>

          {canEditRoleTemplates ? (
            <TabsContent value="role" className="space-y-4">
              <SectionCard title="Role default permissions">
                <p className="mb-4 text-sm text-muted-foreground">
                  Applies to all users with this role unless they have user-level overrides. Saving
                  replaces the role&apos;s permission set.
                </p>
                <div className="mb-4 max-w-md space-y-2">
                  <p className="text-sm font-medium">Role</p>
                  <Select value={roleId || undefined} onValueChange={handleRoleSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {roleId && roleSlugsLoading ? <LoadingSpinner /> : null}
                {roleId && roleSlugsSuccess && roleSlugPayload ? (
                  <PermissionMatrix
                    permissions={grantableGrouped}
                    selectedPermissions={effectiveRoleSlugs}
                    onChange={(next) => setRoleDraft(next)}
                  />
                ) : null}
                <PermissionGate permission="permissions.assign_roles">
                  <Button
                    className="mt-4"
                    onClick={handleSaveRole}
                    disabled={!roleId || saveRoleMutation.isPending || roleSlugsLoading}
                  >
                    {saveRoleMutation.isPending ? 'Saving…' : 'Save role permissions'}
                  </Button>
                </PermissionGate>
              </SectionCard>
            </TabsContent>
          ) : null}
        </Tabs>
      ) : null}
    </div>
  );
}
