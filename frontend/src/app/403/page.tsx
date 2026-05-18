export default function ForbiddenPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 bg-[#fafafa] px-4 py-16 font-sans">
      <h1 className="text-2xl font-semibold text-neutral-900">403 Forbidden</h1>
      <p className="max-w-md text-center text-sm text-neutral-600">
        You do not have permission to access this page.
      </p>
    </div>
  );
}
