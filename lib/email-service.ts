import { Resend } from 'resend';

// Dedicated in-memory deduplication set for Sent Order Numbers (prevents duplicate emails on retries/webhooks)
const sentOrderEmails = new Set<string>();

export interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: Array<{
    product_name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export async function sendOrderConfirmationEmail(orderData: OrderEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Resend Email Service] RESEND_API_KEY is missing in process.env. Email sending skipped.');
    return { success: false, reason: 'RESEND_API_KEY_MISSING' };
  }

  // Duplicate protection check
  if (sentOrderEmails.has(orderData.orderNumber)) {
    console.log(`[Resend Email Service] Order #${orderData.orderNumber} email already sent. Skipping duplicate.`);
    return { success: true, reason: 'DUPLICATE_SKIPPED' };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ZYRO Wear <onboarding@resend.dev>';

  // HTML Template with ZYRO Wear Black / White / Gold styling
  const itemsHtml = orderData.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #262930; color: #FFFFFF; font-size: 14px;">
          <strong>${item.product_name}</strong><br/>
          <span style="color: #9CA3AF; font-size: 12px;">Size: ${item.size}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #262930; color: #FFFFFF; font-size: 14px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #262930; color: #FFC700; font-size: 14px; font-weight: bold; text-align: right;">
          ₹${item.price * item.quantity}
        </td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZYRO Wear Order #${orderData.orderNumber} Confirmed</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0A0B0C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #FFFFFF;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0B0C; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" style="background-color: #121417; border: 1px solid #262930; border-radius: 12px; overflow: hidden; max-width: 600px; width: 100%;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="padding: 30px 20px; background-color: #0A0B0C; border-bottom: 2px solid #FFC700;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #FFC700;">ZYRO WEAR</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px; color: #9CA3AF;">WEAR YOUR ENERGY.</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 30px 25px;">
                <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid #10B981; border-radius: 8px; padding: 12px 15px; margin-bottom: 25px; text-align: center;">
                  <span style="color: #10B981; font-weight: bold; font-size: 14px;">✓ ORDER CONFIRMED & PAYMENT RECEIVED</span>
                </div>

                <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #FFFFFF;">THANK YOU, ${orderData.customerName.toUpperCase()}!</h2>
                <p style="margin: 0 0 25px 0; font-size: 14px; color: #9CA3AF; line-height: 1.6;">
                  Your order <strong>#${orderData.orderNumber}</strong> has been successfully placed and is now in our dispatch processing queue.
                </p>

                <!-- Order Reference Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0B0C; border: 1px solid #262930; border-radius: 8px; margin-bottom: 25px;">
                  <tr>
                    <td style="padding: 15px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="font-size: 13px; color: #9CA3AF; padding: 4px 0;">Order Reference:</td>
                          <td align="right" style="font-size: 14px; font-weight: bold; color: #FFC700; padding: 4px 0;">#${orderData.orderNumber}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 13px; color: #9CA3AF; padding: 4px 0;">Payment Status:</td>
                          <td align="right" style="font-size: 13px; font-weight: bold; color: #10B981; padding: 4px 0;">${orderData.paymentStatus}</td>
                        </tr>
                        <tr>
                          <td style="font-size: 13px; color: #9CA3AF; padding: 4px 0;">Order Date:</td>
                          <td align="right" style="font-size: 13px; color: #FFFFFF; padding: 4px 0;">${new Date(orderData.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Items Table -->
                <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: #FFC700; letter-spacing: 0.5px;">ORDERED ITEMS</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #0A0B0C;">
                      <th align="left" style="padding: 10px 12px; font-size: 12px; color: #9CA3AF; font-weight: bold; border-bottom: 1px solid #262930;">ITEM</th>
                      <th align="center" style="padding: 10px 12px; font-size: 12px; color: #9CA3AF; font-weight: bold; border-bottom: 1px solid #262930;">QTY</th>
                      <th align="right" style="padding: 10px 12px; font-size: 12px; color: #9CA3AF; font-weight: bold; border-bottom: 1px solid #262930;">PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <!-- Totals -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                  <tr>
                    <td style="font-size: 14px; color: #9CA3AF; padding: 4px 0;">Subtotal:</td>
                    <td align="right" style="font-size: 14px; color: #FFFFFF; padding: 4px 0;">₹${orderData.subtotal}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; color: #9CA3AF; padding: 4px 0;">Express Shipping:</td>
                    <td align="right" style="font-size: 14px; color: #FFFFFF; padding: 4px 0;">${orderData.subtotal >= 999 ? 'FREE' : '₹49'}</td>
                  </tr>
                  <tr style="border-top: 1px solid #262930;">
                    <td style="font-size: 16px; font-weight: bold; color: #FFFFFF; padding: 10px 0 0 0;">Total Amount:</td>
                    <td align="right" style="font-size: 18px; font-weight: 900; color: #FFC700; padding: 10px 0 0 0;">₹${orderData.totalAmount}</td>
                  </tr>
                </table>

                <!-- Delivery Address -->
                <div style="background-color: #0A0B0C; border: 1px solid #262930; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                  <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #FFC700; text-transform: uppercase;">Shipping Address</h4>
                  <p style="margin: 0; font-size: 13px; color: #D1D5DB; line-height: 1.5;">
                    <strong>${orderData.customerName}</strong><br/>
                    ${orderData.address}<br/>
                    ${orderData.city}, ${orderData.state} - ${orderData.pincode}<br/>
                    Phone: ${orderData.phone}
                  </p>
                </div>

                <p style="margin: 0; font-size: 13px; color: #9CA3AF; text-align: center; line-height: 1.5;">
                  If you have any questions, reply to this email or chat with us on WhatsApp at <strong>+91 72005 15977</strong>.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 20px; background-color: #0A0B0C; border-top: 1px solid #262930; font-size: 12px; color: #6B7280;">
                <p style="margin: 0 0 5px 0;">&copy; 2026 ZYRO Wear. Built Different. Made for You.</p>
                <p style="margin: 0;">This is an automated order confirmation email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [orderData.email],
      subject: `ZYRO Wear — Order #${orderData.orderNumber} Confirmed`,
      html: emailHtml,
    });

    // Mark order as sent in memory deduplication cache
    sentOrderEmails.add(orderData.orderNumber);
    console.log(`[Resend Email Service] Successfully sent confirmation email for Order #${orderData.orderNumber} to ${orderData.email}`, data);
    return { success: true, data };
  } catch (error: any) {
    console.error(`[Resend Email Service Error] Failed to send email for Order #${orderData.orderNumber}:`, error);
    // Return error without throwing so checkout process is never broken
    return { success: false, error: error.message || error };
  }
}
