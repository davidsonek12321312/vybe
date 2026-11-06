// Minimal types for the one react-dom/server call used by the metadata tests.
declare module 'react-dom/server' {
  export function renderToStaticMarkup(node: import('react').ReactNode): string;
}
