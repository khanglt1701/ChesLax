/** Guards in-flight AI replies so a restart or undo cannot apply a stale move. */
export class AiMoveSession {
  private generation = 0;

  begin(): number {
    this.generation += 1;
    return this.generation;
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  invalidate(): void {
    this.generation += 1;
  }
}

export function remainingThinkDelay(startedAt: number, delayMs: number, now: number): number {
  return Math.max(0, delayMs - (now - startedAt));
}

export interface ScheduledAiMove<TPromotion = string> {
  from: string;
  to: string;
  promotion?: TPromotion;
}

interface ScheduleAiReplyOptions<TMove extends ScheduledAiMove> {
  session: AiMoveSession;
  delayMs: number;
  computeMove: () => TMove | null;
  applyMove: (move: TMove) => void;
  onSettled?: () => void;
  now?: () => number;
  wait?: (ms: number, cb: () => void) => number;
  cancelWait?: (id: number) => void;
  yieldMs?: number;
}

export function scheduleAiReply<TMove extends ScheduledAiMove>(options: ScheduleAiReplyOptions<TMove>): () => void {
  const now = options.now ?? (() => performance.now());
  const wait = options.wait ?? ((ms, cb) => window.setTimeout(cb, ms));
  const cancelWait = options.cancelWait ?? ((id) => window.clearTimeout(id));
  const generation = options.session.begin();
  const startedAt = now();
  const timers: number[] = [];

  const settleIfCurrent = () => {
    if (options.session.isCurrent(generation)) options.onSettled?.();
  };

  timers.push(
    wait(options.yieldMs ?? 0, () => {
      if (!options.session.isCurrent(generation)) return;
      const move = options.computeMove();
      const remaining = remainingThinkDelay(startedAt, options.delayMs, now());
      timers.push(
        wait(remaining, () => {
          if (!options.session.isCurrent(generation)) return;
          if (move) options.applyMove(move);
          settleIfCurrent();
        }),
      );
    }),
  );

  return () => {
    options.session.invalidate();
    for (const id of timers) cancelWait(id);
    options.onSettled?.();
  };
}
