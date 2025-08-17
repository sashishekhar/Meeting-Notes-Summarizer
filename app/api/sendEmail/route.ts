import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, text } = await req.json();

    // Basic validation
    if (!to || !text) {
      return new Response(
        JSON.stringify({ success: false, error: "`to` and `text` are required." }),
        { status: 400 }
      );
    }

    // Send email
    const data = await resend.emails.send({
      from: "Summariser <onboarding@resend.dev>", // use a verified sender
      to,
      subject: subject || "Meeting Summary",
      text,
      html: `<p>${text.replace(/\n/g, "<br>")}</p>`, // optional: HTML version
    });

    return new Response(JSON.stringify({ success: true, data }), { status: 200 });
  } catch (error) {
    console.error("Resend error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to send email." }), {
      status: 500,
    });
  }
}
