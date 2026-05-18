import { Suspense } from 'react';

import { LoginView } from './login-view';

function LoginFallback() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#fafafa] px-4 py-12 font-sans">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6B3D] border-t-transparent"
        aria-hidden
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  );
}
