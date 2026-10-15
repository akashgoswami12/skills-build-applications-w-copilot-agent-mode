import { useApiResource } from '../api/useApiResource.js';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

const loadLeaderboard = () => getJson<{ leaderboard: Entry[] }>('/api/leaderboard');

export default function Leaderboard() {
  const resource = useApiResource(loadLeaderboard);
  return <section aria-labelledby="leaderboard-heading">
    <h2 id="leaderboard-heading">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {resource.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load leaderboard.</p>}
    {resource.status === 'success' && (resource.data.leaderboard.length === 0
      ? <p>No rankings yet.</p>
      : <ol className="list-group list-group-numbered">{resource.data.leaderboard.map((entry) => <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
        <span>{entry.teamName}</span><span>{entry.totalPoints} points</span>
      </li>)}</ol>)}
  </section>;
}
