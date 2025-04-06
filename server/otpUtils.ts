import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Generate a new OTP secret
export function generateSecret(username: string): string {
  return authenticator.generateSecret();
}

// Generate a QR code for the OTP secret
export async function generateQrCode(username: string, secret: string): Promise<string> {
  const service = 'Millikit Admin';
  const otpauth = authenticator.keyuri(username, service, secret);
  
  try {
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Verify an OTP token
export function verifyToken(token: string, secret: string): boolean {
  try {
    // The token parameter is passed as-is without conversion
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}