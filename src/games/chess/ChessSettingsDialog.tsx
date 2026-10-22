import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import {
  GAME_TIME_PRESETS,
  MOVE_TIME_PRESETS,
  settingsSummary,
  type ChessTimeSettings,
} from './chessClock';

interface ChessSettingsDialogProps {
  open: boolean;
  value: ChessTimeSettings;
  contained?: boolean;
  onCancel: () => void;
  onApply: (settings: ChessTimeSettings) => void;
}

export function ChessSettingsDialog({ open, value, contained, onCancel, onApply }: ChessSettingsDialogProps) {
  const [draft, setDraft] = useState<ChessTimeSettings>(value);

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
          Cài đặt thời gian
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Mỗi bên có một đồng hồ tổng cho cả ván. Có thể thêm giới hạn cho từng nước đi. Hết giờ thì đối phương thắng.
        </p>

        <section className="mt-6">
          <h3 className="text-sm font-semibold">Tổng thời gian mỗi bên</h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {GAME_TIME_PRESETS.map((preset) => (
              <PresetButton
                key={preset.id}
                active={draft.gameTimeMs === preset.ms}
                onClick={() => setDraft((current) => ({ ...current, gameTimeMs: preset.ms }))}
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
          {settingsSummary(draft)}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Hủy
          </Button>
          <Button onClick={() => onApply(draft)}>
            Áp dụng và ván mới
          </Button>
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
