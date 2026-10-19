import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  member_name: string;
  member_email: string;
  renewal_type: string;
  certification_number: string;
  approval_date: string;
  remarks?: string;
}

function buildEmailHtml(payload: EmailPayload): string {
  const { member_name, renewal_type, certification_number, approval_date, remarks } = payload;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Renewal Application Approved</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#003A8C 0%,#0056B8 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0;color:#7EB8FF;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Computer Engineers Professional Certification Board</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">CPECB Portal</h1>
            </td>
          </tr>

          <!-- Approved Banner -->
          <tr>
            <td style="background-color:#E6F9F0;border-bottom:3px solid #22C55E;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#16A34A;">&#10003;&nbsp; Renewal Application Approved</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:15px;color:#374151;">Dear <strong>${member_name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
                Congratulations! We are pleased to inform you that your <strong>${renewal_type} renewal application</strong> has been
                <span style="color:#16A34A;font-weight:700;">successfully approved</span> by the CPECB.
              </p>

              <!-- Details box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFF;border:1px solid #DBEAFE;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${buildRow('Application Type', `${renewal_type} Renewal`)}
                      ${buildRow('Certification Number', certification_number)}
                      ${buildRow('Approval Date', approval_date)}
                      ${remarks ? buildRow('Remarks', remarks) : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;"><strong>Next Steps:</strong></p>
              <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:15px;line-height:1.9;">
                <li>Log in to the CPECB Portal to view your updated certification status.</li>
                <li>Your renewed certificate details will be reflected in your member profile.</li>
                <li>Keep a copy of this email for your records.</li>
              </ul>

              <p style="margin:0 0 8px;font-size:15px;color:#374151;line-height:1.7;">
                If you have any questions or concerns, please contact the CPECB Secretariat.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#9CA3AF;">This is an automated notification from the CPECB Portal.</p>
              <p style="margin:0;font-size:12px;color:#9CA3AF;">Computer Engineers Professional Certification Board &mdash; Philippines</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#6B7280;width:45%;">${label}</td>
      <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${value}</td>
    </tr>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured — email notification skipped.");
    return new Response(
      JSON.stringify({ skipped: true, reason: "RESEND_API_KEY not set. Add it in Supabase Dashboard > Project Settings > Edge Functions > Secrets." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // FROM_EMAIL secret lets you switch from the test address to your verified domain without redeploying.
  // Test (no domain verification needed): "CPECB Portal <onboarding@resend.dev>"
  // Production (requires domain verified in Resend): "CPECB Portal <noreply@cpecb.org>"
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "CPECB Portal <onboarding@resend.dev>";

  let payload: EmailPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { member_email, member_name, renewal_type, certification_number, approval_date } = payload;
  if (!member_email || !member_name || !renewal_type || !certification_number || !approval_date) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const html = buildEmailHtml(payload);

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [member_email],
      subject: `Your ${renewal_type} Renewal Application Has Been Approved — CPECB`,
      html,
    }),
  });

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error("Resend API error:", resendRes.status, errBody);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: errBody }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const result = await resendRes.json();
  return new Response(
    JSON.stringify({ success: true, id: result.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
