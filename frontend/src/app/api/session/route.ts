import { NextResponse } from 'next/server';

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
