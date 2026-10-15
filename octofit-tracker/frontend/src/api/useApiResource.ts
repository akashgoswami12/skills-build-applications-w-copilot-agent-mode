import { useEffect, useState } from 'react';

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T };

export function useApiResource<T>(load: () => Promise<T>): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then(
      (data) => { if (active) setState({ status: 'success', data }); },
      () => { if (active) setState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [load]);

  return state;
}