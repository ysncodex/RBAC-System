interface Props {
  title: string;

  description?: string;
}

export function EmptyState({ title, description }: Props) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed text-center">
      <h3 className="text-lg font-semibold">{title}</h3>

      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
