import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'expenses',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'add',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'summary',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
