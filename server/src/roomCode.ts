import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(exists: (code: string) => boolean, length = 6): string {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    let code = '';
    for (let i = 0; i < length; i += 1) {
      code += ALPHABET[randomInt(ALPHABET.length)];
    }
    if (!exists(code)) return code;
  }
  throw new Error('Không tạo được mã phòng duy nhất.');
}

export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

export function isPlausibleRoomCode(code: string): boolean {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(code);
}
