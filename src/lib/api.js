/** fetch() a la API con JSON y mensajes de error legibles. */
export async function api(path, { method = 'GET', body, signal } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw Object.assign(new Error('No hay conexión con el servidor. Revisá tu internet.'), { status: 0 });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
