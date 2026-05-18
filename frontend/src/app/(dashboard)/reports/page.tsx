'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, FileBarChart, Users, ClipboardList, Target } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { PermissionGate } from '@/components/shared/permission-gate';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthReadyForApi } from '@/hooks/useAuthReadyForApi';
import { useLocalLeads } from '@/hooks/useLocalLeads';
import { useLocalTasks } from '@/hooks/useLocalTasks';
import { getAuditLogs } from '@/services/audit.service';
import { getUsers } from '@/services/users.service';
import { useAuthStore, selectUserPermissions, selectUser } from '@/store/auth.store';
import type { User } from '@/types/user';
import type { AuditLogEntry } from '@/services/audit.service';

function downloadCsv(filename: string, rows: string[][]) {
  const esc = (cell: string) => `"${String(cell).replace(/"/g, '""')}"`;
  const body = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const authReady = useAuthReadyForApi();
  const user = useAuthStore(selectUser);
  const permissions = useAuthStore(selectUserPermissions);
  const permSet = React.useMemo(() => new Set(permissions), [permissions]);

  const canUsers = permSet.has('users.view');
  const canAudit = permSet.has('audit.view');
  const canExport = permSet.has('reports.export');
  const canLeads = permSet.has('leads.view');
  const canTasks = permSet.has('tasks.view');
  const isAgent = user?.role === 'agent';

  const { leads, hydrated: leadsHydrated } = useLocalLeads(user?.id);
  const { tasks, hydrated: tasksHydrated } = useLocalTasks(user?.id);

  const usersQuery = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: authReady && canUsers,
    staleTime: 60_000,
  });

  const auditQuery = useQuery<AuditLogEntry[]>({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
    enabled: authReady && canAudit,
    staleTime: 30_000,
  });

  const users = React.useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const logs = React.useMemo(() => auditQuery.data ?? [], [auditQuery.data]);
  const [reportNowMs] = React.useState(() => Date.now());

  const teamByRole = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const u of users) {
      const key = u.role.slug;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [users]);

  const auditLast7d = React.useMemo(() => {
    const cutoff = reportNowMs - 7 * 24 * 60 * 60 * 1000;
    return logs.filter((l) => new Date(l.createdAt).getTime() >= cutoff).length;
  }, [logs, reportNowMs]);

  const activeUsers = React.useMemo(
    () => users.filter((u) => u.status === 'ACTIVE').length,
    [users]
  );

  function handleExport() {
    if (!canExport) return;
    const rows: string[][] = [];
    if (canAudit && logs.length > 0) {
      rows.push(['createdAt', 'actorName', 'actorEmail', 'action', 'targetType', 'targetId', 'ip']);
      for (const row of logs.slice(0, 1000)) {
        rows.push([
          row.createdAt,
          row.actor.name,
          row.actor.email,
          row.action,
          row.targetType,
          row.targetId ?? '',
          row.ipAddress ?? '',
        ]);
      }
      downloadCsv(`audit-export-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, rows);
      toast.success('Audit export downloaded');
      return;
    }
    if (canUsers && users.length > 0) {
      rows.push(['name', 'email', 'role', 'status']);
      for (const u of users) {
        rows.push([u.name, u.email, u.role.name, u.status]);
      }
      downloadCsv(`users-export-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, rows);
      toast.success('Users export downloaded');
      return;
    }
    if (canLeads && leads.length > 0) {
      rows.push(['id', 'company', 'contactName', 'email', 'value', 'stage', 'updatedAt']);
      for (const l of leads) {
        rows.push([l.id, l.company, l.contactName, l.email, String(l.value), l.stage, l.updatedAt]);
      }
      downloadCsv(`my-leads-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, rows);
      toast.success('Leads export downloaded');
      return;
    }
    if (canTasks && tasks.length > 0) {
      rows.push(['id', 'title', 'description', 'status', 'createdAt']);
      for (const t of tasks) {
        rows.push([t.id, t.title, t.description, t.status, t.createdAt]);
      }
      downloadCsv(`my-tasks-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, rows);
      toast.success('Tasks export downloaded');
      return;
    }
    toast.message('Nothing to export', {
      description: 'Add leads or tasks, enable directory/audit export, or ask for broader access.',
    });
  }

  const loadingCards = (canUsers && usersQuery.isLoading) || (canAudit && auditQuery.isLoading);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={
          isAgent
            ? 'Operational snapshots from modules your manager unlocked. Directory and audit tiles require extra permissions.'
            : 'High-level metrics from modules you can access. Exports require reports.export.'
        }
        action={
          <PermissionGate permission="reports.export">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 sm:w-auto"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </PermissionGate>
        }
      />

      {loadingCards ? <p className="text-sm text-muted-foreground">Loading metrics…</p> : null}

      {(canLeads || canTasks) && leadsHydrated && tasksHydrated ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {canLeads ? (
            <Card className="ring-foreground/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My leads (this device)</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leads.length}</div>
                <CardDescription>Pipeline cards stored locally for your login.</CardDescription>
              </CardContent>
            </Card>
          ) : null}
          {canTasks ? (
            <Card className="ring-foreground/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My tasks (this device)</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
                <CardDescription>
                  {tasks.filter((t) => t.status === 'TODO').length} to do ·{' '}
                  {tasks.filter((t) => t.status === 'IN_PROGRESS').length} in progress ·{' '}
                  {tasks.filter((t) => t.status === 'DONE').length} done
                </CardDescription>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="ring-foreground/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Directory</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {canUsers ? (
              <>
                <div className="text-2xl font-bold">{users.length}</div>
                <CardDescription>
                  {activeUsers} active · {users.length - activeUsers} other statuses
                </CardDescription>
              </>
            ) : (
              <CardDescription>You do not have users.view.</CardDescription>
            )}
          </CardContent>
        </Card>

        <Card className="ring-foreground/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit (7 days)</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {canAudit ? (
              <>
                <div className="text-2xl font-bold">{auditLast7d}</div>
                <CardDescription>{logs.length} events loaded (windowed)</CardDescription>
              </>
            ) : (
              <CardDescription>You do not have audit.view.</CardDescription>
            )}
          </CardContent>
        </Card>

        <Card className="ring-foreground/5 sm:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team composition</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {canUsers ? (
              teamByRole.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {teamByRole.map(([slug, n]) => (
                    <li key={slug} className="flex justify-between gap-2">
                      <span className="capitalize text-muted-foreground">{slug}</span>
                      <span className="font-semibold tabular-nums">{n}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <CardDescription>No rows in your current directory view.</CardDescription>
              )
            ) : (
              <CardDescription>You do not have users.view.</CardDescription>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="ring-foreground/5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Export</CardTitle>
            <CardDescription>
              CSV prefers audit, then directory, then your local leads/tasks when unlocked and
              reports.export is granted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionGate permission="reports.export">
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Download snapshot
              </Button>
            </PermissionGate>
            {!canExport ? (
              <p className="text-xs text-muted-foreground">Requires reports.export.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <SectionCard title="Recent audit (preview)">
        {!canAudit ? (
          <p className="text-sm text-muted-foreground">Grant audit.view to preview events here.</p>
        ) : auditQuery.isError ? (
          <p className="text-sm text-destructive">Could not load audit logs.</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries yet.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {logs.slice(0, 12).map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2"
              >
                <span className="font-medium">{row.action}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(row.createdAt), 'MMM d, HH:mm')} · {row.actor.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
