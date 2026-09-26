const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'data', 'email_notifications.log');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Check if nodemailer is available and SMTP credentials exist
    try {
      const nodemailer = require('nodemailer');
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        console.log('EmailService: Live SMTP Transporter initialized.');
      } else {
        console.log('EmailService: Running in simulation & logging mode (Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env for real SMTP).');
      }
    } catch {
      console.log('EmailService: Running in simulation mode.');
    }
  }

  async sendOrderConfirmation(order) {
    const customerEmail = order.customerEmail || (order.shippingAddress ? order.shippingAddress.email : '');
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || '';

    const itemsHtml = order.items.map(i => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #EEE;">
          <img src="${i.image}" width="40" height="40" style="object-fit: contain; vertical-align: middle; margin-right: 8px;">
          <strong>${i.title}</strong>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: center;">${i.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #EEE; text-align: right;">₹${(i.price * i.qty).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2874F0; color: #FFF; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">ZenithKart</h1>
          <p style="margin: 5px 0 0; font-size: 14px;">Order Confirmation & Invoice Receipt</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #0F172A; margin-top: 0;">Thank you for your order!</h2>
          <p style="color: #64748B;">Hi ${order.shippingAddress.name}, we have received your order <strong>#${order.id}</strong>.</p>
          
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 14px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Order ID:</strong> ${order.id}</p>
            <p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> ${order.estimatedDelivery}</p>
            <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${order.paymentMethod} (${order.status})</p>
            <p style="margin: 4px 0;"><strong>Deliver to:</strong> ${order.shippingAddress.name}, ${order.shippingAddress.address}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}</p>
          </div>

          <h3 style="margin-top: 20px; color: #0F172A;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #F1F5F9;">
                <th style="padding: 8px 10px; text-align: left;">Item</th>
                <th style="padding: 8px 10px; text-align: center;">Qty</th>
                <th style="padding: 8px 10px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 16px;">
            <p style="margin: 4px 0;">Total Amount Paid: <strong style="color: #2874F0; font-size: 18px;">₹${(order.totals ? order.totals.grandTotal : 0).toLocaleString('en-IN')}</strong></p>
          </div>
        </div>
        <div style="background: #F1F5F9; padding: 14px; text-align: center; font-size: 12px; color: #64748B;">
          Need help? Contact support@zenithkart.com | 100% Genuine Products Guaranteed
        </div>
      </div>
    `;

    const logEntry = {
      timestamp: new Date().toISOString(),
      orderId: order.id,
      customerEmail: customerEmail || 'Not provided',
      adminEmail: adminEmail || 'Not set',
      subject: `Order Confirmed: #${order.id} - ZenithKart`,
      totals: order.totals
    };

    // Append to log file
    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to email log:', err);
    }

    // If live SMTP configured, dispatch
    if (this.transporter && customerEmail) {
      try {
        await this.transporter.sendMail({
          from: `"ZenithKart Orders" <${process.env.SMTP_USER}>`,
          to: customerEmail,
          bcc: adminEmail || undefined,
          subject: logEntry.subject,
          html: htmlContent
        });
        console.log(`Live confirmation email dispatched to ${customerEmail}`);
      } catch (err) {
        console.error('SMTP Send Error:', err.message);
      }
    }

    return {
      success: true,
      deliveredTo: customerEmail || 'Logged locally (Configure SMTP_HOST in .env for live dispatch)',
      logEntry
    };
  }
}

module.exports = new EmailService();
