// Type declaration for react/jsx-runtime to fix React 19 TypeScript issues
// This augments the global namespace to ensure JSX types are preserved
import 'react'

declare module 'react/jsx-runtime' {
  import type { ReactElement } from 'react'
  
  export function jsx(
    type: React.ElementType,
    props: any,
    key?: React.Key
  ): ReactElement
  
  export function jsxs(
    type: React.ElementType,
    props: any,
    key?: React.Key
  ): ReactElement
  
  export { Fragment } from 'react'
}
