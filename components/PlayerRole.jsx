import { asset } from '../lib/paths';

export default function PlayerRole({ player }) {
  return (
    <p className="role player-role">
      <span>{player.role}</span>
      <span className="role-pick">
        <span className="role-separator" aria-hidden="true" />
        <img src={asset(player.signature.image)} alt="" width="28" height="28" />
        <span>{player.signature.name}</span>
      </span>
    </p>
  );
}
