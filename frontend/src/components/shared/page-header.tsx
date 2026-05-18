import { ReactNode } from 'react';

interface Props {
  title: string;

  description?: string;

  action?: ReactNode;
}

export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>

        {description && <p className="text-muted-foreground">{description}</p>}
      </div>

      {action}
    </div>
  );
}
