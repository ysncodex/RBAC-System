import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface DataCardField {
  label: string;
  value: ReactNode;
  className?: string;
}

interface DataCardProps {
  children?: ReactNode;
  fields?: DataCardField[];
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DataCard({ children, fields, header, footer, className }: DataCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4 shadow-sm ring-1 ring-foreground/5',
        className
      )}
    >
      {header ? <div className="mb-3">{header}</div> : null}

      {fields ? (
        <dl className="space-y-2.5">
          {fields.map((field) => (
            <div key={field.label} className={cn('flex flex-col gap-0.5 sm:flex-row sm:gap-4', field.className)}>
              <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-24">
                {field.label}
              </dt>
              <dd className="min-w-0 text-sm">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {children}

      {footer ? <div className="mt-3 border-t pt-3">{footer}</div> : null}
    </div>
  );
}
