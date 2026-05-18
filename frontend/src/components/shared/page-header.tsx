import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface Props {
  title: string;

  description?: string;

  action?: ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>

        {description ? (
          <p className="mt-1 text-pretty break-words text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-2', 'w-full sm:w-auto')}>
          {action}
        </div>
      ) : null}
    </div>
  );
}
