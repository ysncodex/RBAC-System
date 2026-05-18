import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function RootLoading() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#fafafa] font-sans">
      <LoadingSpinner />
    </div>
  );
}
