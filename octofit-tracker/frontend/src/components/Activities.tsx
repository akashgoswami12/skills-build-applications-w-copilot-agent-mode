import { useApiResource } from '../api/useApiResource.js';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number; occurredAt?: string };

const loadActivities = () => getJson<{ activities: Activity[] }>('/api/activities');

export default function Activities() {
  const resource = useApiResource(loadActivities);
  return <section aria-labelledby="activities-heading">
    <h2 id="activities-heading">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {resource.status === 'loading' && <p role="status">Loading activities...</p>}
    {resource.status === 'error' && <p role="alert">Unable to load activities.</p>}
    {resource.status === 'success' && (resource.data.activities.length === 0
      ? <p>No activities yet.</p>
      : <ul className="list-group">{resource.data.activities.map((activity, index) => <li className="list-group-item" key={`${activity.type}-${activity.occurredAt ?? index}`}>
        <strong>{activity.type}</strong> <span>{activity.minutes} minutes</span> <span>{activity.points} points</span>
      </li>)}</ul>)}
  </section>;
}
