// Background reads never overlap. Explicit refreshes supersede older reads,
// including reads started before a successful mutation.
export function createRefreshController({ fetchData, onData, onError, onSettled }) {
  let active = null;
  let disposed = false;

  async function refresh({ background = false } = {}) {
    if (disposed || (background && active)) return;
    active?.abort();
    const controller = new AbortController();
    active = controller;
    try {
      const data = await fetchData(controller.signal);
      if (!disposed && active === controller) onData(data);
    } catch (error) {
      if (!disposed && active === controller && !controller.signal.aborted) onError(error);
    } finally {
      if (!disposed && active === controller) {
        active = null;
        onSettled();
      }
    }
  }

  return {
    refresh,
    dispose() {
      disposed = true;
      active?.abort();
      active = null;
    },
  };
}
