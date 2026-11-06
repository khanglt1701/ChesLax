const PERSONAS: Record<string, { name: string; avatarId: string }> = {
  beginner: { name: 'Minh An', avatarId: 'seal-2' },
  easy: { name: 'Tuấn Kiệt', avatarId: 'seal-3' },
  medium: { name: 'Lan Chi', avatarId: 'seal-4' },
  normal: { name: 'Lan Chi', avatarId: 'seal-4' },
  hard: { name: 'Quang Huy', avatarId: 'seal-5' },
  expert: { name: 'Thu Hà', avatarId: 'seal-6' },
  advanced: { name: 'Bảo Long', avatarId: 'seal-7' },
};

const FALLBACK = PERSONAS.normal!;

export function aiOpponentPersona(difficulty?: string | null): { name: string; avatarId: string } {
  return PERSONAS[difficulty ?? ''] ?? FALLBACK;
}

export function aiOpponentName(difficulty?: string | null): string {
  return aiOpponentPersona(difficulty).name;
}
