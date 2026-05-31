/**
 * Logger de uso de servicios externos.
 * Registra cada llamada para monitoreo de cuotas.
 */
export function logExternalCall(provider: string, ok: boolean, latencyMs: number) {
  console.log(JSON.stringify({
    type: 'external_call',
    provider,
    ok,
    latencyMs,
    timestamp: new Date().toISOString(),
  }));
}

export function logLimitWarning(provider: string, detail: string) {
  console.warn(JSON.stringify({
    type: 'LIMIT_WARNING',
    provider,
    detail,
    timestamp: new Date().toISOString(),
  }));
}
