import { neighbors } from './coGanhGraph';
import { CO_GANH_BLUE, CO_GANH_EMPTY, CO_GANH_POINTS, CO_GANH_RED, type CoGanhSide } from './coGanh.types';

/**
 * Luật Vây (group liberties, similar to Go / cờ vây).
 * Opponent pieces connected along board lines share empty adjacent points.
 * A group with no liberty is converted. Being blocked in only one direction
 * is not Vây — the group must have zero legal steps to an empty point.
 */
export function detectVays(cells: number[], attacker: CoGanhSide): number[] {
  const defender = attacker === 'red' ? CO_GANH_BLUE : CO_GANH_RED;
  const seen = new Uint8Array(CO_GANH_POINTS);
  const captured: number[] = [];

  for (let index = 0; index < CO_GANH_POINTS; index += 1) {
    if (cells[index] !== defender || seen[index]) continue;
    const group: number[] = [];
    const stack = [index];
    seen[index] = 1;
    let liberties = 0;

    while (stack.length > 0) {
      const current = stack.pop()!;
      group.push(current);
      for (const next of neighbors(current)) {
        const occupant = cells[next] ?? CO_GANH_EMPTY;
        if (occupant === CO_GANH_EMPTY) {
          liberties += 1;
        } else if (occupant === defender && !seen[next]) {
          seen[next] = 1;
          stack.push(next);
        }
      }
    }

    if (liberties === 0) captured.push(...group);
  }

  return captured;
}

export function hasLiberty(cells: number[], index: number): boolean {
  return neighbors(index).some((next) => (cells[next] ?? CO_GANH_EMPTY) === CO_GANH_EMPTY);
}
