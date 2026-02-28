import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Configure your verified Resend sender domain in .env.local as RESEND_FROM_EMAIL
// e.g. RESEND_FROM_EMAIL="AJ Hair ZA <orders@ajhair.co.za>"
// Until your domain is verified, use the Resend test address for local dev.
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "AJ Hair ZA <onboarding@resend.dev>";

interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  hairType: string;
  length: string;
  color: string;
}

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

function formatZAR(amount: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(amount);
}

function buildItemRows(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
        <strong style="display:block;font-size:14px;">${item.title}</strong>
        ${item.hairType ? `<span style="font-size:12px;color:#6b7280;">Type: ${item.hairType}</span><br/>` : ""}
        ${item.length ? `<span style="font-size:12px;color:#6b7280;">Length: ${item.length}</span><br/>` : ""}
        ${item.color ? `<span style="font-size:12px;color:#6b7280;">Color: ${item.color}</span>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;">${formatZAR(item.price * item.quantity)}</td>
    </tr>`,
    )
    .join("");
}

function buildEmailHtml(data: OrderEmailData): string {
  const { street, suburb, city, province, postalCode } = data.shippingAddress;
  const addressParts = [street, suburb, city, province, postalCode].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:0.05em;">AJ HAIR ZA</h1>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:14px;">Premium Hair Extensions</p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:32px;text-align:center;border-bottom:1px solid #f0f0f0;">
              <div style="display:inline-block;background:#d1fae5;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;margin-bottom:16px;">✓</div>
              <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">Order Confirmed!</h2>
              <p style="margin:0;color:#6b7280;font-size:14px;">Hi ${data.customerName}, thank you for your order.</p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">Order #${data.orderId.slice(0, 8).toUpperCase()}</p>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:24px 32px;">
              <h3 style="margin:0 0 16px;font-size:16px;color:#111827;">Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="border-bottom:2px solid #111827;">
                    <th style="padding-bottom:8px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Item</th>
                    <th style="padding-bottom:8px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
                    <th style="padding-bottom:8px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${buildItemRows(data.items)}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;">Subtotal</td>
                  <td style="padding:4px 0;font-size:14px;text-align:right;">${formatZAR(data.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;">VAT (15%)</td>
                  <td style="padding:4px 0;font-size:14px;text-align:right;">${formatZAR(data.tax)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#6b7280;">Shipping</td>
                  <td style="padding:4px 0;font-size:14px;text-align:right;">${data.shipping === 0 ? "Free" : formatZAR(data.shipping)}</td>
                </tr>
                <tr style="border-top:2px solid #111827;">
                  <td style="padding:12px 0 4px;font-size:16px;font-weight:700;color:#111827;">Total</td>
                  <td style="padding:12px 0 4px;font-size:16px;font-weight:700;text-align:right;color:#111827;">${formatZAR(data.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding:0 32px 24px;">
              <div style="background:#f9fafb;border-radius:8px;padding:16px;">
                <h3 style="margin:0 0 8px;font-size:14px;color:#111827;">Shipping To</h3>
                <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${addressParts.join(", ")}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #f0f0f0;">
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Questions? Reply to this email or contact us.</p>
              <p style="margin:0;font-size:12px;color:#d1d5db;">© ${new Date().getFullYear()} AJ Hair ZA. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(
  data: OrderEmailData,
): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.customerEmail,
      subject: `Order Confirmed #${data.orderId.slice(0, 8).toUpperCase()} — AJ Hair ZA`,
      html: buildEmailHtml(data),
    });

    if (error) {
      console.error("Resend error:", error);
    } else {
      console.log("Confirmation email sent to:", data.customerEmail);
    }
  } catch (err) {
    // Email failure should never block the order — log and continue
    console.error("Failed to send confirmation email:", err);
  }
}
