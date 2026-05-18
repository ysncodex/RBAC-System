import { NextRequest, NextResponse } from 'next/server';

function getApiOrigin(): string {
  return process.env.API_PROXY_TARGET?.trim().replace(/\/$/, '') ?? '';
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return NextResponse.json(
      { message: 'API_PROXY_TARGET is not configured on the frontend host' },
      { status: 503 },
    );
  }

  const path = pathSegments.join('/');
  const url = `${apiOrigin}/api/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  const upstream = await fetch(url, init);
  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) responseHeaders.set('content-type', upstreamType);

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [];
  if (setCookies.length > 0) {
    for (const value of setCookies) {
      responseHeaders.append('set-cookie', value);
    }
  } else {
    const single = upstream.headers.get('set-cookie');
    if (single) responseHeaders.set('set-cookie', single);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
