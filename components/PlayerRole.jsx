import { asset } from '../lib/paths';

export default function PlayerRole({ player, as: Tag = 'p' }) {
  return (
    <Tag className="role player-role">
      <span>{player.role}</span>
      <span className="role-pick">
        <span className="role-separator" aria-hidden="true" />
        <img src={asset(player.signature.image)} alt="" width="20" height="20" />
        <span>{player.signature.name}</span>
      </span>
    </Tag>
  );
}
