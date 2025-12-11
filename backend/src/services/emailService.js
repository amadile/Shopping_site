import nodemailer from 'nodemailer'
import { logger } from '../config/logger.js'

class EmailService {
  constructor() {
    console.log('📧 EmailService Initializing...');
    console.log('   SMTP_HOST:', process.env.SMTP_HOST);
    console.log('   SMTP_USER:', process.env.SMTP_USER);
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '**** (Set)' : 'MISSING');

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  /**
   * Send email verification
   */
  async sendVerificationEmail(email, name, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`

    const mailOptions = {
      from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ${process.env.SHOP_NAME || 'Our Shop'}!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for creating an account with us! We're excited to have you on board.</p>
              <p>To complete your registration and start shopping, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with us, please ignore this email.</p>
              <p>Best regards,<br>The ${process.env.SHOP_NAME || 'Shopping Site'} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Shopping Site'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info('Verification email sent', { email })
      return true
    } catch (error) {
      logger.error('Failed to send verification email', { email, error: error.message })
      throw error
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password will remain unchanged</li>
                </ul>
              </div>
              <p>Best regards,<br>The ${process.env.SHOP_NAME || 'Shopping Site'} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Shopping Site'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info('Password reset email sent', { email })
      return true
    } catch (error) {
      logger.error('Failed to send password reset email', { email, error: error.message })
      throw error
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(email, name, orderDetails) {
    const { orderId, total, items, shippingAddress } = orderDetails

    const mailOptions = {
      from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Order Confirmation - ${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .order-summary { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .item { border-bottom: 1px solid #e5e7eb; padding: 10px 0; }
            .total { font-size: 18px; font-weight: bold; color: #10b981; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Order Confirmed!</h1>
              <p>Order #${orderId}</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Thank you for your order! We've received it and will process it shortly.</p>
              
              <div class="order-summary">
                <h3>Order Summary</h3>
                ${items.map(item => `
                  <div class="item">
                    <strong>${item.name}</strong><br>
                    Quantity: ${item.quantity} × UGX ${item.price.toLocaleString()}<br>
                    Subtotal: UGX ${(item.quantity * item.price).toLocaleString()}
                  </div>
                `).join('')}
                <div class="total">
                  Total: UGX ${total.toLocaleString()}
                </div>
              </div>

              <h3>Shipping Address</h3>
              <p>
                ${shippingAddress.fullName}<br>
                ${shippingAddress.addressLine1}<br>
                ${shippingAddress.city}, ${shippingAddress.state}<br>
                ${shippingAddress.phone}
              </p>

              <p>We'll send you another email when your order ships.</p>
              <p>Best regards,<br>The ${process.env.SHOP_NAME || 'Shopping Site'} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Shopping Site'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info('Order confirmation email sent', { email, orderId })
      return true
    } catch (error) {
      logger.error('Failed to send order confirmation email', { email, orderId, error: error.message })
      // Don't throw - order was already created
      return false
    }
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(user, order) {
    const { orderId, status, tracking } = order
    const email = user.email
    const name = user.name

    let subject = `Order Update - ${orderId}`
    let message = `Your order status has been updated to: ${status}`
    let trackingInfo = ''

    if (status === 'shipped') {
      subject = `Your Order Has Shipped! - ${orderId}`
      message = 'Great news! Your order is on its way.'
      if (tracking && tracking.trackingNumber) {
        trackingInfo = `
          <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Tracking Information</h3>
            <p><strong>Carrier:</strong> ${tracking.carrier.toUpperCase()}</p>
            <p><strong>Tracking Number:</strong> ${tracking.trackingNumber}</p>
            ${tracking.trackingUrl ? `<p><a href="${tracking.trackingUrl}" class="button" style="font-size: 14px; padding: 8px 15px;">Track Package</a></p>` : ''}
          </div>
        `
      }
    } else if (status === 'delivered') {
      subject = `Your Order Has Been Delivered! - ${orderId}`
      message = 'Your package has arrived! We hope you enjoy your purchase.'
    }

    const mailOptions = {
      from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Update</h1>
              <p>Order #${orderId}</p>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>${message}</p>
              
              ${trackingInfo}

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/orders/${orderId}" class="button">View Order Details</a>
              </div>
              
              <p>Best regards,<br>The ${process.env.SHOP_NAME || 'Shopping Site'} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Shopping Site'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info('Order status update email sent', { email, orderId, status })
      return true
    } catch (error) {
      logger.error('Failed to send order status update email', { email, orderId, error: error.message })
      return false
    }
  }

  /**
   * Send generic notification email
   */
  async sendNotificationEmail(user, notificationData) {
    const { title, message, actionUrl } = notificationData
    const email = user.email
    const name = user.name

    const mailOptions = {
      from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: title,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>${message}</p>
              
              ${actionUrl ? `
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}${actionUrl}" class="button">View Details</a>
              </div>
              ` : ''}
              
              <p>Best regards,<br>The ${process.env.SHOP_NAME || 'Shopping Site'} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Shopping Site'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info('Notification email sent', { email, title })
      return true
    } catch (error) {
      logger.error('Failed to send notification email', { email, title, error: error.message })
      return false
    }
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email, name) {
    const mailOptions = {
      from: `"${process.env.SHOP_NAME || 'Shopping Site'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome! Your Account is Verified',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome Aboard!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Your email has been verified successfully! You're all set to start shopping.</p>
              <p>Here's what you can do now:</p>
              <ul>
                <li>Browse thousands of products</li>
                <li>Add items to your cart</li>
                <li>Track your orders</li>
                <li>Save your favorite items</li>
                <li>Get exclusive deals and offers</li>
              </ul>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">Start Shopping</a>
              </div>
              <p>If you have any questions, feel free to contact our support team.</p>
              <p>Happy shopping!<br>The ${process.env.SHOP_NAME || 'Shopping Site'} Team</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${process.env.SHOP_NAME || 'Shopping Site'}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info('Welcome email sent', { email })
      return true
    } catch (error) {
      logger.error('Failed to send welcome email', { email, error: error.message })
      return false
    }
  }
  /**
   * Initialize the transporter with current environment variables
   */
  init() {
    console.log('📧 EmailService Re-initializing...');
    console.log('   SMTP_USER:', process.env.SMTP_USER);

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
}

const emailService = new EmailService();
export default emailService;
