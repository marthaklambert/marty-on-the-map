import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const res = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (res.ok || res.status === 201) {
    return NextResponse.json({ ok: true });
  }

  const data = await res.json().catch(() => null);
  console.log("Buttondown response:", res.status, JSON.stringify(data));

  // Already subscribed is not an error
  if (res.status === 400 && data?.email_address?.includes("already")) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Subscription failed", detail: data }, { status: 400 });
}
