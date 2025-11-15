import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Redirect to Supabase Edge Function for better performance and reliability
  const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lemonsqueezy-webhook`;

  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature");

    // Forward the request to the edge function
    const response = await fetch(edgeFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": signature || "",
      },
      body: body,
    });

    const responseData = await response.text();

    return new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error forwarding webhook to edge function:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
