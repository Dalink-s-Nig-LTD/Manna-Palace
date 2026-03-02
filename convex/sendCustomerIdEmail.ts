import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendCustomerIdEmail = action({
  args: {
    to: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    customerId: v.string(),
    pdfBase64: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured.");
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);border:1px solid #d1d9e6;">
    
    <div style="background:#1e40af;padding:24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">Manna Palace</h1>
      <p style="margin:6px 0 0;color:#bfdbfe;font-size:14px;font-weight:400;">Official Customer ID Notification</p>
    </div>

    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Hello <strong>${args.firstName} ${args.lastName}</strong>,</p>
      
      <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
        Your digital Customer ID Card is ready! We've attached it to this email as a PDF. To start using your cafeteria wallet, please follow these simple steps:
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:24px;">
        <h3 style="margin:0 0 12px;color:#1e40af;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Next Steps:</h3>
        
        <table border="0" cellpadding="0" cellspacing="0" style="width:100%; color:#334155; font-size:14px; line-height:1.8;">
          <tr>
            <td style="vertical-align:top; width:25px;">🔵</td>
            <td><strong>Download & Save:</strong> Open the attached PDF file.</td>
          </tr>
          <tr>
            <td style="vertical-align:top; width:25px;">🔵</td>
            <td><strong>Print:</strong> Use standard card size (85.6mm × 54mm).</td>
          </tr>
          <tr>
            <td style="vertical-align:top; width:25px;">🔵</td>
            <td><strong>Scan & Pay:</strong> Present your barcode at the cafeteria.</td>
          </tr>
        </table>
      </div>

      <div style="border-left:4px solid #3b82f6; padding-left:16px; margin-bottom:24px;">
        <p style="margin:0; color:#64748b; font-size:13px; font-style:italic;">
          <strong>Tip:</strong> Keep your barcode private. It is directly linked to your personal wallet balance.
        </p>
      </div>

      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
        Questions? Visit the Cafeteria Admin Office for on-site support.
      </p>
    </div>

    <div style="background:#f1f5f9;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#1e3a8a;font-size:12px;font-weight:700;">Manna Palace Cafeteria</p>
      <p style="margin:4px 0 0;color:#64748b;font-size:10px;">Redeemer's University, Ede, Osun State, Nigeria</p>
    </div>
  </div>
</body>

</html>`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Manna Palace", email: "mannapalacecafeteria@gmail.com" },
        to: [{ email: args.to }],
        subject: `Your Manna Palace Customer ID - ${args.firstName} ${args.lastName}`,
        htmlContent,
        attachment: [
          {
            content: args.pdfBase64,
            name: `ID_${args.firstName}_${args.lastName}.pdf`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }

    return { success: true };
  },
});
