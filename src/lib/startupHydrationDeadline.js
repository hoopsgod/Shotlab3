export const STARTUP_HYDRATION_TIMEOUT_MS = 8_000;

export async function settleStartupHydration(
  hydrate,
  {
    timeoutMs = STARTUP_HYDRATION_TIMEOUT_MS,
    onTimeout,
  } = {},
) {
  let timeoutId;
  const hydration = Promise.resolve()
    .then(() => hydrate())
    .then(
      (value) => ({ status: "completed", value }),
      (error) => ({ status: "failed", error }),
    );
  const deadline = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      onTimeout?.();
      resolve({ status: "timeout" });
    }, Math.max(0, timeoutMs));
  });

  const result = await Promise.race([hydration, deadline]);
  clearTimeout(timeoutId);
  return result;
}
