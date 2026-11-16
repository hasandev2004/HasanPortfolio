export type AppRoute =
  | {type: 'home'}
  | {type: 'case-study'; slug: string}
  | {type: 'not-found'; path: string};

export function parsePathname(pathname: string): AppRoute {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/') {
    return {type: 'home'};
  }

  const projectMatch = /^\/projects\/([^/]+)$/.exec(normalized);
  if (projectMatch) {
    return {
      type: 'case-study',
      slug: decodeURIComponent(projectMatch[1]),
    };
  }

  return {type: 'not-found', path: pathname};
}

export function getCurrentRoute(): AppRoute {
  if (typeof window === 'undefined') {
    return {type: 'home'};
  }
  return parsePathname(window.location.pathname);
}

export function pushRoute(path: string): AppRoute {
  if (typeof window !== 'undefined') {
    const normalizedTarget = path.replace(/\/+$/, '') || '/';
    const normalizedCurrent = window.location.pathname.replace(/\/+$/, '') || '/';
    if (normalizedTarget !== normalizedCurrent) {
      window.history.pushState({}, '', path);
    }
  }
  return parsePathname(path);
}
