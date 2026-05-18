'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { PageHeader } from '@/components/shared/page-header';
import { PermissionGate } from '@/components/shared/permission-gate';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore, selectUser } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const PREF_KEY = 'rbac-ui-prefs';

type UiPrefs = {
  compactTables: boolean;
  reduceMotion: boolean;
};

function loadPrefs(): UiPrefs {
  if (typeof window === 'undefined') return { compactTables: false, reduceMotion: false };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    const p = raw ? (JSON.parse(raw) as Partial<UiPrefs>) : {};
    return {
      compactTables: Boolean(p.compactTables),
      reduceMotion: Boolean(p.reduceMotion),
    };
  } catch {
    return { compactTables: false, reduceMotion: false };
  }
}

function savePrefs(p: UiPrefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {}
}

export default function SettingsPage() {
  const user = useAuthStore(selectUser);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [prefs, setPrefs] = React.useState<UiPrefs>(() =>
    typeof window === 'undefined'
      ? { compactTables: false, reduceMotion: false }
      : loadPrefs(),
  );

  React.useEffect(() => {
    document.documentElement.dataset.compactTables = prefs.compactTables ? 'true' : 'false';
    document.documentElement.dataset.reduceMotion = prefs.reduceMotion ? 'true' : 'false';
    savePrefs(prefs);
  }, [prefs]);

  function updatePrefs(patch: Partial<UiPrefs>) {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Profile comes from your session. Appearance and UI toggles apply on this device."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Profile">
          {user ? (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{user.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="break-all font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                  {user.role}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Permissions</dt>
                <dd className="text-xs text-muted-foreground">
                  {user.permissions.length} granted in this session
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Not signed in.</p>
          )}
        </SectionCard>

        <SectionCard title="Appearance">
          <p className="mb-4 text-sm text-muted-foreground">
            Theme is applied with{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">class</code> on the document
            root.
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = mounted && theme === id;
              return (
                <Button
                  key={id}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  className={cn('gap-2', active && 'shadow-sm')}
                  onClick={() => setTheme(id)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              );
            })}
          </div>
          {mounted ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Resolved: <span className="font-medium capitalize">{resolvedTheme ?? '—'}</span>
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Loading theme…</p>
          )}
        </SectionCard>
      </div>

      <PermissionGate permission="settings.edit">
        <SectionCard title="Interface">
          <p className="mb-4 text-sm text-muted-foreground">
            Stored in local storage on this browser. Wire compact mode to tables when you adopt{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">data-compact-tables</code> in
            components.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="ring-foreground/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Compact tables</CardTitle>
                <CardDescription>Denser rows in data-heavy screens.</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={prefs.compactTables}
                    onCheckedChange={(v) => updatePrefs({ compactTables: v === true })}
                  />
                  <span>Use compact spacing</span>
                </label>
              </CardContent>
            </Card>
            <Card className="ring-foreground/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Reduce motion</CardTitle>
                <CardDescription>Limits smooth scrolling for comfort.</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={prefs.reduceMotion}
                    onCheckedChange={(v) => updatePrefs({ reduceMotion: v === true })}
                  />
                  <span>Prefer reduced motion</span>
                </label>
              </CardContent>
            </Card>
          </div>
        </SectionCard>
      </PermissionGate>
    </div>
  );
}
