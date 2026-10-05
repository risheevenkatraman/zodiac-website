import type { Player } from './types';

const roleOrder: Record<string, number> = { tank: 0, damage: 1, support: 2 };

export function comparePlayerRoles(a: Player, b: Player) {
  return (
    (roleOrder[a.role.trim().toLowerCase()] ?? 3) - (roleOrder[b.role.trim().toLowerCase()] ?? 3)
  );
}

export function playersByRole(players: Player[]) {
  return [...players].sort(comparePlayerRoles);
}
