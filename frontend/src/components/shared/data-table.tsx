import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function DataTable({ children }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">{children}</div>
    </div>
  );
}
