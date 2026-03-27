import { NextRequest, NextResponse } from 'next/server';

const authUrl = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN === 'local'
  ? 'https://local.auth.nhost.run/v1'
  : `https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.auth.${process.env.NEXT_PUBLIC_NHOST_REGION ?? 'eu-central-1'}.nhost.run/v1`;

export async function PATCH(req: NextRequest) {
  const authorization = req.headers.get('authorization') ?? '';
  const body = await req.json();

  const res = await fetch(`${authUrl}/user`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      authorization,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
