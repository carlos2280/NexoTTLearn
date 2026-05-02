/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "*.css"
declare module "@carlos2280/nexott-ui/tokens"
declare module "@carlos2280/nexott-ui/animations"
declare module "@carlos2280/nexott-ui/utilities"
declare module "@carlos2280/nexott-ui/themes/*"
