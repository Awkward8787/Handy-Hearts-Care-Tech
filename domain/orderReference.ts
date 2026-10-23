export class OrderReference {
  static readonly prefix = 'HH-';
  static readonly alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  static readonly length = 10;

  static create(random?: () => Uint8Array): string {
    const bytes = random ? random() : crypto.getRandomValues(new Uint8Array(OrderReference.length));
    let body = '';
    for (let index = 0; index < OrderReference.length; index += 1) {
      body += OrderReference.alphabet[bytes[index] % OrderReference.alphabet.length];
    }
    return `${OrderReference.prefix}${body}`;
  }

  static isValid(value: string): boolean {
    if (!value.startsWith(OrderReference.prefix)) return false;
    const body = value.slice(OrderReference.prefix.length);
    if (body.length !== OrderReference.length) return false;
    return [...body].every((character) => OrderReference.alphabet.includes(character));
  }
}
