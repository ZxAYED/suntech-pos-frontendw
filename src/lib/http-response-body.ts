/** The Fetch Response constructor rejects a body for these statuses. */
export function allowsResponseBody(method: string, status: number): boolean {
  return method.toUpperCase() !== "HEAD" && ![204, 205, 304].includes(status);
}
