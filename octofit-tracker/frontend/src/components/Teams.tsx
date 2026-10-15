import { useApiResource } from '../api/useApiResource.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot: string; members: unknown[] };

const loadTeams = () => getJson<{ teams: Team[] }>('/api/teams');

export default function Teams() {
  const resource = useApiResource(loadTeams);
  return <section aria-labelledby="teams-heading">
    <h2 id="teams-heading">Teams</h2>
    <p>Manage teams and members.</p>
    {resource.status === 'loading' && <p role="status">Loading teams...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load teams.</p>}
    {resource.status === 'success' && (resource.data.teams.length === 0
      ? <p>No teams yet.</p>
      : <ul className="list-group">{resource.data.teams.map((team) => <li className="list-group-item" key={team.name}>
        <strong>{team.name}</strong> <span>Mascot: {team.mascot}</span> <span>{team.members.length} members</span>
      </li>)}</ul>)}
  </section>;
}
