'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getApiErrorMessage, login } from '@/services/auth';
import { useAuthStore, selectSessionReady } from '@/store/auth.store';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { getPostLoginRedirect } from '@/utils/safe-return-url';

const loginSchema = z.object({
  email: z.email({ message: 'Enter a valid email address' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const inputClass =
  'h-11 rounded-xl border-[#E0E0E0] bg-white px-3.5 text-[#333333] placeholder:text-[#999999] shadow-none focus-visible:border-[#FF6B3D] focus-visible:ring-[#FF6B3D]/25';

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const sessionReady = useAuthStore(selectSessionReady);
  const shouldShowLogin = useGuestGuard();
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const returnUrl = searchParams.get('returnUrl');

  const onSubmit = React.useCallback(
    async (values: LoginFormValues) => {
      clearErrors('root');

      try {
        const data = await login({
          email: values.email.trim().toLowerCase(),
          password: values.password.trim(),
        });
        setAuth(data.accessToken, data.user);
        toast.success('Signed in successfully');
        router.replace(getPostLoginRedirect(returnUrl, data.user.permissions));
      } catch (err) {
        const message = getApiErrorMessage(err);
        toast.error(message);
        setError('root', { message });
      }
    },
    [clearErrors, returnUrl, router, setAuth, setError]
  );

  if (!sessionReady) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-[#fafafa] px-4 py-12">
        <p className="text-sm text-muted-foreground">Checking session…</p>
      </div>
    );
  }

  if (!shouldShowLogin) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#fafafa] px-4 py-12 font-sans">
      <div className="w-full max-w-[420px] rounded-[28px] bg-white px-8 py-10 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black">Login</h1>
          <p className="mt-2 text-sm text-[#999999]">Enter your details to continue</p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <label htmlFor="login-email" className="block text-sm font-semibold text-[#333333]">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              aria-invalid={Boolean(errors.email)}
              className={cn(inputClass)}
              {...register('email')}
            />
            {errors.email?.message ? (
              <p className="text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="block text-sm font-semibold text-[#333333]">
              Password
            </label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
                className={cn(inputClass, 'pr-11')}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#999999] outline-none hover:text-[#666666] focus-visible:ring-2 focus-visible:ring-[#FF6B3D]/40"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-5" aria-hidden />
                ) : (
                  <EyeIcon className="size-5" aria-hidden />
                )}
              </button>
            </div>
            {errors.password?.message ? (
              <p className="text-xs text-red-600" role="alert">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
                className="border-[#E0E0E0] data-checked:border-[#FF6B3D] data-checked:bg-[#FF6B3D]"
              />
              <span className="text-sm text-[#999999]">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#FF6B3D] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {errors.root?.message ? (
            <p
              className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700"
              role="alert"
            >
              {errors.root.message}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'h-12 w-full rounded-xl border-0 bg-[#FF6B3D] text-base font-bold text-white shadow-[0_8px_24px_-6px_rgba(255,107,61,0.55)] hover:bg-[#ff5729]',
              'disabled:opacity-70'
            )}
          >
            {isSubmitting ? 'Signing in…' : 'Log in'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-[#999999]">
          Don&apos;t have an account?{' '}
          <Link
            href={returnUrl ? `/signup?returnUrl=${encodeURIComponent(returnUrl)}` : '/signup'}
            className="font-bold text-black hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
