export function tp(tenantId: string, path: string): string {
  return `/t/${tenantId}${path}`
}
