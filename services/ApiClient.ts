export const ApiClient = {
  async get(path: string) {
    const res = await fetch(path, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(await res.text() || res.statusText);
    return res.json();
  },
  async post(path: string, data: any) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error(await res.text() || res.statusText);
    return res.json();
  }
};

export default ApiClient;
