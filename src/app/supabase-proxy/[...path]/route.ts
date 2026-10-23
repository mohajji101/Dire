import type { NextRequest } from "next/server";

// Forwards browser Supabase calls through our own domain so users in regions
// where supabase.co is blocked by their ISP can still use the app.
const HOP_BY_HOP = ["host", "connection", "content-length", "accept-encoding", "cookie"];

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    return new Response("Supabase is not configured.", { status: 500 });
  }

  const { path } = await params;
  const target = `${supabaseUrl}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers(request.headers);
  HOP_BY_HOP.forEach((name) => headers.delete(name));

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
export const OPTIONS = forward;
