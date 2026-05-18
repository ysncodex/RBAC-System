'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { useAuthReadyForApi } from '@/hooks/useAuthReadyForApi';
import { PageHeader } from '@/components/shared/page-header';
import { SectionCard } from '@/components/shared/section-card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { getAuditLogs } from '@/services/audit.service';

export default function AuditPage() {
  const authReady = useAuthReadyForApi();
  const {
    data: logs = [],
    isLoading: queryLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: getAuditLogs,
    enabled: authReady,
    staleTime: 1000 * 30,
  });
  const isLoading = !authReady || queryLoading;

  function formatMetadata(meta: unknown): string {
    if (meta == null) return '—';
    try {
      const s = JSON.stringify(meta);
      return s.length > 120 ? `${s.slice(0, 117)}…` : s;
    } catch {
      return '—';
    }
  }

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Append-only history of security-relevant actions (logins, permission changes, user lifecycle, and more)."
      />

      <SectionCard title="Recent events">
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <div className="space-y-4 p-2">
            <p className="text-sm text-destructive">Failed to load audit logs.</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit entries"
            description="Actions will appear here as they occur."
          />
        ) : (
          <DataTable>
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Actor</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">IP</th>
                  <th className="px-4 py-3 text-left">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <div className="truncate font-medium" title={row.actor.name}>
                        {row.actor.name}
                      </div>
                      <div
                        className="truncate text-xs text-muted-foreground"
                        title={row.actor.email}
                      >
                        {row.actor.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.targetType}
                      {row.targetId ? (
                        <>
                          <br />
                          <span className="text-muted-foreground">{row.targetId}</span>
                        </>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{row.ipAddress ?? '—'}</td>
                    <td
                      className="max-w-[min(280px,30vw)] truncate px-4 py-3 font-mono text-xs text-muted-foreground"
                      title={formatMetadata(row.metadata)}
                    >
                      {formatMetadata(row.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        )}
      </SectionCard>
    </div>
  );
}
