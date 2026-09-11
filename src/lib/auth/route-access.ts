const PROTECTED_ROUTES = ["/dashboard"];

export function shouldRedirectUnauthenticated(pathname: string, user: unknown): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) && !user;
}
