// useParkingStatus.js
// -----------------------------------------------------------------------------
// Custom React hook: loads /api/status and reloads it every 2 seconds, so the
// page stays up to date (even if another browser tab changes something).
// -----------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';

export function useParkingStatus(intervalMs = 2000) {
  const [status, setStatus] = useState(null); // latest status from the server
  const [error, setError] = useState(''); //     connection error message

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.getStatus());
      setError('');
    } catch {
      setError('Cannot reach the server. Is the backend running on port 4000?');
    }
  }, []);

  useEffect(() => {
    refresh(); // load once immediately
    const timer = setInterval(refresh, intervalMs); // then keep polling
    return () => clearInterval(timer); // stop when the page is closed
  }, [refresh, intervalMs]);

  // setStatus is returned too, so a page can show the fresh status that comes
  // back from a POST request without waiting for the next poll.
  return { status, setStatus, error, refresh };
}
