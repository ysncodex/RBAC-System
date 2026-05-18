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
    <div className="space-y-6">
      {Object.entries(permissions).map(([module, modulePermissions]) => (
        <div key={module} className="rounded-xl border">
          <div className="border-b bg-muted/50 px-4 py-3">
            <h3 className="font-semibold capitalize">{module}</h3>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-2">
            {modulePermissions.map((permission) => (
              <label key={permission.id} className="flex items-center gap-3">
                <Checkbox
                  checked={selectedPermissions.includes(permission.slug)}
                  onCheckedChange={() => togglePermission(permission.slug)}
                />

                <span className="text-sm">{permission.slug}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
