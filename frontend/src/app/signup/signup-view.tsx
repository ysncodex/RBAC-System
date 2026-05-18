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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getApiErrorMessage, register as registerApi } from '@/services/auth';
import { useAuthStore, selectSessionReady } from '@/store/auth.store';
import { useGuestGuard } from '@/hooks/useAuthGuard';
import { getPostLoginRedirect } from '@/utils/safe-return-url';

const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.email({ message: 'Enter a valid email address' }),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

const inputClass =
  'h-11 rounded-xl border-[#E0E0E0] bg-white px-3.5 text-[#333333] placeholder:text-[#999999] shadow-none focus-visible:border-[#FF6B3D] focus-visible:ring-[#FF6B3D]/25';

export function SignupView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const sessionReady = useAuthStore(selectSessionReady);
  const shouldShowSignup = useGuestGuard();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const returnUrl = searchParams.get('returnUrl');

  const onSubmit = React.useCallback(
    async (values: SignupFormValues) => {
      clearErrors('root');

      try {
        const data = await registerApi({
          name: values.name,
          email: values.email,
          password: values.password,
        });
        setAuth(data.accessToken, data.user);
        toast.success('Account created successfully');
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

  if (!shouldShowSignup) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-[#fafafa] px-4 py-8 sm:py-12 font-sans">
      <div className="w-full max-w-[420px] rounded-[20px] bg-white px-5 py-8 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] sm:rounded-[28px] sm:px-8 sm:py-10">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-black">Sign up</h1>
          <p className="mt-2 text-sm text-[#999999]">Create an account to get started</p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="block text-sm font-semibold text-[#333333]">
              Name
            </label>
            <Input
              id="signup-name"
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={Boolean(errors.name)}
              className={cn(inputClass)}
              {...register('name')}
            />
            {errors.name?.message ? (
              <p className="text-xs text-red-600" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="block text-sm font-semibold text-[#333333]">
              Email
            </label>
            <Input
              id="signup-email"
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
            <label htmlFor="signup-password" className="block text-sm font-semibold text-[#333333]">
              Password
            </label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
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

          <div className="space-y-2">
            <label htmlFor="signup-confirm" className="block text-sm font-semibold text-[#333333]">
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="signup-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={cn(inputClass, 'pr-11')}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#999999] outline-none hover:text-[#666666] focus-visible:ring-2 focus-visible:ring-[#FF6B3D]/40"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="size-5" aria-hidden />
                ) : (
                  <EyeIcon className="size-5" aria-hidden />
                )}
              </button>
            </div>
            {errors.confirmPassword?.message ? (
              <p className="text-xs text-red-600" role="alert">
                {errors.confirmPassword.message}
              </p>
            ) : null}
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
            {isSubmitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-[#999999]">
          Already have an account?{' '}
          <Link
            href={returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'}
            className="font-bold text-black hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
