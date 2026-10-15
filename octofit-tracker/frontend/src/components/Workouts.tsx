import { useApiResource } from '../api/useApiResource.js';
import { getJson } from '../api/client.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };

const email = 'mona@example.com';
const loadSuggestions = () => getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${encodeURIComponent(email)}`);

export default function Workouts() {
  const resource = useApiResource(loadSuggestions);
  return <section aria-labelledby="workouts-heading">
    <h2 id="workouts-heading">Workout suggestions</h2>
    <p>Recommendations for {email}</p>
    {resource.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load workout suggestions.</p>}
    {resource.status === 'success' && (resource.data.suggestions.length === 0
      ? <p>No workout suggestions yet.</p>
      : <ul className="list-group">{resource.data.suggestions.map((workout) => <li className="list-group-item" key={workout.title}>
        <strong>{workout.title}</strong> <span>{workout.focus}, {workout.minutes} minutes, {workout.difficulty}</span><p className="mb-0">{workout.reason}</p>
      </li>)}</ul>)}
  </section>;
}
