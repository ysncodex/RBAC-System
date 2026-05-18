import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function DashboardSegmentLoading() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-[#fafafa] font-sans">
      <LoadingSpinner />
    </div>
  );
}
