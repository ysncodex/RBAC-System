import { ReactNode } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  title: string;

  children: ReactNode;
}

export function SectionCard({ title, children }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 py-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</CardContent>
    </Card>
  );
}
