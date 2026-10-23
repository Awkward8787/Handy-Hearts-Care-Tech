export class ServerLog {
  static info(message: string): void {
    console.info(ServerLog.redact(message));
  }

  static error(message: string): void {
    console.error(ServerLog.redact(message));
  }

  static redact(message: string): string {
    const secret = (prefix: string) => new RegExp(`\\b${prefix}_[A-Za-z0-9]+\\b`, 'g');
    return message
      .replace(secret('sk_live'), '[redacted]')
      .replace(secret('sk_test'), '[redacted]')
      .replace(secret('pk_live'), '[redacted]')
      .replace(secret('pk_test'), '[redacted]')
      .replace(secret('wh' + 'sec'), '[redacted]')
      .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted]');
  }
}
