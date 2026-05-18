'use client';

import { Checkbox } from '@/components/ui/checkbox';

export interface PermissionRow {
  id: string;

  slug: string;
}

interface Props {
  permissions: Record<string, PermissionRow[]>;

  selectedPermissions: string[];

  onChange: (permissions: string[]) => void;
}

export function PermissionMatrix({ permissions, selectedPermissions, onChange }: Props) {
  function togglePermission(slug: string) {
    if (selectedPermissions.includes(slug)) {
      onChange(selectedPermissions.filter((p) => p !== slug));
    } else {
      onChange([...selectedPermissions, slug]);
    }
  }

  return (
    <div className="max-h-[min(70dvh,720px)] space-y-4 overflow-y-auto overscroll-contain pr-1">
      {Object.entries(permissions).map(([module, modulePermissions]) => (
        <div key={module} className="overflow-hidden rounded-xl border">
          <div className="sticky top-0 z-10 border-b bg-muted/80 px-4 py-3 backdrop-blur-sm">
            <h3 className="font-semibold capitalize">{module}</h3>
            <p className="text-xs text-muted-foreground">
              {modulePermissions.filter((p) => selectedPermissions.includes(p.slug)).length} of{' '}
              {modulePermissions.length} selected
            </p>
          </div>

          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
            {modulePermissions.map((permission) => (
              <label
                key={permission.id}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 transition-colors hover:bg-muted/40 sm:items-center"
              >
                <Checkbox
                  className="mt-0.5 shrink-0 sm:mt-0"
                  checked={selectedPermissions.includes(permission.slug)}
                  onCheckedChange={() => togglePermission(permission.slug)}
                />

                <span className="min-w-0 break-words text-sm leading-snug">{permission.slug}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
