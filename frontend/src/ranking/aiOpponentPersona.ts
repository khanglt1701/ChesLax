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

export function looksLikeAiLabel(name: string): boolean {
  const value = name.trim().toLowerCase();
  return (
    value.includes('máy') ||
    value.includes('may —') ||
    value.includes('ai opponent') ||
    value === 'máy cheslax' ||
    /^ai\b/.test(value)
  );
}

export function presentSeatIdentity(
  seat: { name: string; avatarId: string; isAi?: boolean },
  difficulty?: string | null,
): { name: string; avatarId: string } {
  if (!seat.isAi && !looksLikeAiLabel(seat.name)) {
    return { name: seat.name, avatarId: seat.avatarId };
  }
  const persona = aiOpponentPersona(difficulty);
  return {
    name: looksLikeAiLabel(seat.name) ? persona.name : seat.name,
    avatarId: looksLikeAiLabel(seat.name) || seat.avatarId === 'seal-1' ? persona.avatarId : seat.avatarId,
  };
}
