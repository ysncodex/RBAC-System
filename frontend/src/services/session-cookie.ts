export async function clearAppSession(): Promise<void> {
  const res = await fetch('/api/session', {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Could not clear legacy session cookie');
  }
}
