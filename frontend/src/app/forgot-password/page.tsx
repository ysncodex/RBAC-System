import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#fafafa] px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-[420px] rounded-[20px] bg-white px-5 py-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] sm:rounded-[28px] sm:px-8 sm:py-10">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black">Forgot password?</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#999999]">
            Password reset via email is not set up yet. Please contact your administrator if you
            need access to your account.
          </p>
        </header>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#FF6B3D] text-base font-bold text-white shadow-[0_8px_24px_-6px_rgba(255,107,61,0.55)] transition-colors hover:bg-[#ff5729]"
          >
            Back to login
          </Link>
          <p className="text-center text-sm text-[#999999]">
            Need an account?{' '}
            <Link href="/signup" className="font-semibold text-[#FF6B3D] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
