/** Input limits enforced by the web, iOS, and server validators. */
export class FieldLimits {
  static readonly name = 120;
  static readonly email = 254;
  static readonly passwordMin = 8;
  static readonly phoneDigitsMin = 10;
  static readonly phoneDigitsMax = 15;
  static readonly address = 500;
  static readonly notes = 2000;
  static readonly issue = 1000;
  static readonly brand = 80;
  static readonly model = 80;
  static readonly devices = 8;
  static readonly accessibilityNote = 500;
}
