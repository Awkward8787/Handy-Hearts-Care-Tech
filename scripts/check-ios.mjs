import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ios = path.join(root, 'ios');
const failures = [];

function read(relative) {
  return readFileSync(path.join(root, relative), 'utf8');
}

function must(condition, message) {
  if (!condition) failures.push(message);
}

function pngSize(file) {
  const bytes = readFileSync(file);
  if (bytes.length < 26 || bytes[0] !== 0x89) return null;
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    colorType: bytes[25],
  };
}

const project = read('ios/HandyHearts.xcodeproj/project.pbxproj');
must(project.includes('objectVersion = 77;'), 'Xcode project objectVersion must be 77');
must(project.includes('PBXFileSystemSynchronizedRootGroup'), 'Xcode project must use a synchronized root group');
must(project.includes('PRODUCT_BUNDLE_IDENTIFIER = com.hhcaretech.handyhearts;'), 'bundle id');
must(project.includes('MARKETING_VERSION = 1.0.0;'), 'marketing version');
must(project.includes('CURRENT_PROJECT_VERSION = 1;'), 'build number');
must(project.includes('IPHONEOS_DEPLOYMENT_TARGET = 15.0;'), 'deployment target');
must(project.includes('https://github.com/stripe/stripe-ios-spm'), 'Stripe package URL');
must(project.includes('version = 26.14.0;'), 'Stripe package version');
must(project.includes('productName = StripePaymentSheet;'), 'Stripe product');
must(project.includes('membershipExceptions = ('), 'Info.plist must be excluded from the copy phase');
must(project.includes('Info.plist,'), 'Info.plist membership exception');

const info = read('ios/HandyHearts/Info.plist');
must(info.includes('<string>The camera is used only if you choose to scan a card.</string>'), 'camera usage string');
must(!info.includes('NSLocation'), 'location permission must not be declared');
must(info.includes('<key>ITSAppUsesNonExemptEncryption</key>') && info.includes('<false/>'), 'encryption flag');
must(info.includes('<string>Light</string>'), 'light interface');
must(info.includes('<string>handyhearts</string>'), 'URL scheme');

const privacy = read('ios/HandyHearts/PrivacyInfo.xcprivacy');
must(privacy.includes('<key>NSPrivacyTracking</key>'), 'privacy tracking key');
must(privacy.includes('<false/>'), 'tracking false');
must(!privacy.includes('NSPrivacyCollectedDataTypeUserID'), 'guest privacy manifest must not collect a user id');
for (const type of ['EmailAddress', 'Name', 'PhoneNumber', 'PhysicalAddress', 'PaymentInfo', 'OtherUserContent']) {
  must(privacy.includes(`NSPrivacyCollectedDataType${type}`), `privacy type ${type}`);
}
must(privacy.includes('NSPrivacyCollectedDataTypePurposeAppFunctionality'), 'privacy purpose');

const config = read('ios/Config.example.xcconfig');
const includeAt = config.indexOf('#include? "Config.local.xcconfig"');
const lastAssignment = Math.max(
  config.lastIndexOf('SUPABASE_URL ='),
  config.lastIndexOf('SUPABASE_ANON_KEY ='),
  config.lastIndexOf('STRIPE_PUBLISHABLE_KEY ='),
  config.lastIndexOf('API_BASE_URL ='),
  config.lastIndexOf('BUSINESS_TIMEZONE ='),
);
must(includeAt > lastAssignment && lastAssignment > 0, 'local xcconfig include must follow the empty assignments');

const swift = [
  'ios/HandyHearts/HandyHeartsApp.swift',
  'ios/HandyHearts/GuestViews.swift',
  'ios/HandyHearts/GuestApi.swift',
  'ios/HandyHearts/StaffViews.swift',
  'ios/HandyHearts/StaffKeychain.swift',
].map(read).join('\n');
must(swift.includes('Request a consultation'), 'guest consultation entry');
must(swift.includes('Book a service'), 'guest booking entry');
must(swift.includes('No account needed'), 'guest copy');
must(swift.includes('PaymentSheet(paymentIntentClientSecret:'), 'classic PaymentSheet initializer');
must(swift.includes('StripeAPI.defaultPublishableKey'), 'publishable key assignment');
must(swift.includes('handyhearts://stripe-redirect'), 'return URL');
must(swift.includes('HandyHearts Care Tech'), 'merchant display name');
must(swift.includes('kSecClassGenericPassword'), 'staff token uses the keychain');
must(!swift.includes('UserDefaults'), 'staff token must not use UserDefaults');
must(!/pi_[A-Za-z0-9]/.test(swift), 'no payment-intent placeholder');
must(!swift.includes("FAMILY"), 'no family role');

must(statSync(path.join(ios, 'HandyHearts/LaunchScreen.storyboard')).isFile(), 'launch screen');
const icon = pngSize(path.join(ios, 'HandyHearts/Assets.xcassets/AppIcon.appiconset/AppIcon.png'));
must(icon && icon.width === 1024 && icon.height === 1024 && icon.colorType === 2, '1024 RGB app icon without alpha');

const pkg = JSON.parse(read('package.json'));
must(pkg.version === '1.0.0', 'package version matches the iOS marketing version');

if (failures.length) {
  console.error(failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log('iOS project structure looks ready for a Mac build.');
