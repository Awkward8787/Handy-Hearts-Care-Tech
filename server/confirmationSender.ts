import nodemailer from 'nodemailer';

export interface OutboundMessage {
  channel: 'email' | 'sms';
  to: string;
  subject: string | null;
  body: string;
}

export interface ConfirmationSender {
  emailConfigured(): boolean;
  smsConfigured(): boolean;
  send(message: OutboundMessage): Promise<'sent' | 'queued' | 'failed'>;
}

export class DeliveryConfirmationSender implements ConfirmationSender {
  constructor(private readonly env: NodeJS.ProcessEnv = process.env) {}

  emailConfigured(): boolean {
    return Boolean(this.env.SMTP_HOST && this.env.SMTP_PORT && this.env.SMTP_FROM);
  }

  smsConfigured(): boolean {
    return Boolean(this.env.TWILIO_ACCOUNT_SID && this.env.TWILIO_AUTH_TOKEN && this.env.TWILIO_FROM);
  }

  async send(message: OutboundMessage): Promise<'sent' | 'queued' | 'failed'> {
    if (message.channel === 'email') return this.sendEmail(message);
    return this.sendSms(message);
  }

  private async sendEmail(message: OutboundMessage): Promise<'sent' | 'queued' | 'failed'> {
    if (!this.emailConfigured()) return 'queued';
    const port = Number(this.env.SMTP_PORT);
    if (!Number.isInteger(port) || port <= 0) return 'failed';
    try {
      const transport = nodemailer.createTransport({
        host: this.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: this.env.SMTP_USER ? { user: this.env.SMTP_USER, pass: this.env.SMTP_PASS ?? '' } : undefined,
      });
      await transport.sendMail({
        from: this.env.SMTP_FROM,
        to: message.to,
        subject: message.subject ?? 'HandyHearts',
        text: message.body,
      });
      return 'sent';
    } catch {
      return 'failed';
    }
  }

  private async sendSms(message: OutboundMessage): Promise<'sent' | 'queued' | 'failed'> {
    if (!this.smsConfigured()) return 'queued';
    if (!message.to.startsWith('+')) return 'failed';
    const sid = this.env.TWILIO_ACCOUNT_SID ?? '';
    const token = this.env.TWILIO_AUTH_TOKEN ?? '';
    const from = this.env.TWILIO_FROM ?? '';
    try {
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: message.to, From: from, Body: message.body }),
      });
      return response.ok ? 'sent' : 'failed';
    } catch {
      return 'failed';
    }
  }
}
