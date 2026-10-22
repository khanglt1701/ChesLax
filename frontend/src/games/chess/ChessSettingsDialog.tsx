import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { AI_LEVELS } from './chessAi';
import {
  TIME_CONTROL_PRESETS,
  MOVE_TIME_PRESETS,
  settingsSummary,
} from './chessClock';
import { BoardThemeSelector } from './BoardThemeSelector';
import { PieceSetSelector } from './PieceSetSelector';
import type { ChessAppearance } from './chessAppearance';
import type { ChessPlaySettings } from './chessSettingsStorage';

interface ChessSettingsDialogProps {
  open: boolean;
  value: ChessPlaySettings;
  appearance: ChessAppearance;
  contained?: boolean;
  onCancel: () => void;
  onApply: (settings: ChessPlaySettings) => void;
  onAppearanceChange: (appearance: ChessAppearance) => void;
}

export function ChessSettingsDialog({
  open,
  value,
  appearance,
  contained,
  onCancel,
  onApply,
  onAppearanceChange,
}: ChessSettingsDialogProps) {
  const [draft, setDraft] = useState<ChessPlaySettings>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'inset-0 z-50 flex items-center justify-center bg-black/45 p-4',
        contained ? 'absolute' : 'fixed',
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chess-settings-title"
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-6 shadow-2xl dark:bg-stone-900"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Cờ vua</p>
        <h2 id="chess-settings-title" className="mt-1 font-display text-3xl">
          Cài đặt ván cờ
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Đổi giao diện bàn và quân cờ áp dụng ngay. Đổi chế độ chơi, mức máy hoặc đồng hồ sẽ bắt đầu ván mới.
        </p>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Giao diện bàn cờ</h3>
          <div className="mt-3">
            <BoardThemeSelector
              value={appearance.boardTheme}
              onChange={(boardTheme) => onAppearanceChange({ ...appearance, boardTheme })}
            />
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Bộ quân cờ</h3>
          <div className="mt-3">
            <PieceSetSelector
              value={appearance.pieceSet}
              onChange={(pieceSet) => onAppearanceChange({ ...appearance, pieceSet })}
            />
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Chế độ chơi</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <PresetButton
              active={draft.opponent === 'human'}
              onClick={() => setDraft((current) => ({ ...current, opponent: 'human' }))}
            >
              Hai người
            </PresetButton>
            <PresetButton
              active={draft.opponent === 'ai'}
              onClick={() => setDraft((current) => ({ ...current, opponent: 'ai' }))}
            >
              Đấu với máy
            </PresetButton>
          </div>
        </section>

        {draft.opponent === 'ai' ? (
          <>
            <section className="mt-6">
              <h3 className="text-sm font-semibold">Mức độ máy</h3>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {AI_LEVELS.map((level) => (
                  <PresetButton
                    key={level.id}
                    active={draft.aiLevel === level.id}
                    onClick={() => setDraft((current) => ({ ...current, aiLevel: level.id }))}
                  >
                    {level.label}
                  </PresetButton>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-500">
                {AI_LEVELS.find((level) => level.id === draft.aiLevel)?.description}
              </p>
            </section>

            <section className="mt-6">
              <h3 className="text-sm font-semibold">Bạn cầm quân</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PresetButton
                  active={draft.playerColor === 'w'}
                  onClick={() => setDraft((current) => ({ ...current, playerColor: 'w' }))}
                >
                  Trắng (đi trước)
                </PresetButton>
                <PresetButton
                  active={draft.playerColor === 'b'}
                  onClick={() => setDraft((current) => ({ ...current, playerColor: 'b' }))}
                >
                  Đen
                </PresetButton>
              </div>
            </section>
          </>
        ) : null}

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Đồng hồ</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {TIME_CONTROL_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                active={draft.gameTimeMs === preset.gameTimeMs && draft.incrementMs === preset.incrementMs}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    gameTimeMs: preset.gameTimeMs,
                    incrementMs: preset.incrementMs,
                  }))
                }
              >
                {preset.label}
              </PresetButton>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Thời gian mỗi nước đi</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MOVE_TIME_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                active={draft.moveTimeMs === preset.ms}
                onClick={() => setDraft((current) => ({ ...current, moveTimeMs: preset.ms }))}
              >
                {preset.label}
              </PresetButton>
            ))}
          </div>
        </section>

        <p className="mt-5 rounded-2xl bg-brand/10 px-4 py-3 text-sm text-stone-600 dark:text-stone-300">
          {draft.opponent === 'ai'
            ? `Đấu với máy mức ${AI_LEVELS.find((level) => level.id === draft.aiLevel)?.label ?? ''} · Bạn cầm ${draft.playerColor === 'w' ? 'Trắng' : 'Đen'} · ${settingsSummary(draft)}`
            : `Hai người trên cùng thiết bị · ${settingsSummary(draft)}`}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={() => onApply(draft)}>Áp dụng và ván mới</Button>
        </div>
      </div>
    </div>
  );
}

function PresetButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition',
        active
          ? 'bg-brand text-white ring-brand'
          : 'bg-white text-stone-600 ring-stone-300 hover:bg-stone-50 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-600',
      )}
    >
      {children}
    </button>
  );
}
