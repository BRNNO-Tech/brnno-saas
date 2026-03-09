'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type OpenNewJobContextValue = {
  openWithClientId: string | null
  setOpenWithClientId: (clientId: string | null) => void
}

const OpenNewJobContext = createContext<OpenNewJobContextValue | null>(null)

export function OpenNewJobProvider({ children }: { children: React.ReactNode }) {
  const [openWithClientId, setOpenWithClientId] = useState<string | null>(null)
  return (
    <OpenNewJobContext.Provider value={{ openWithClientId, setOpenWithClientId }}>
      {children}
    </OpenNewJobContext.Provider>
  )
}

export function useOpenNewJob() {
  const ctx = useContext(OpenNewJobContext)
  if (!ctx) return { openWithClientId: null, setOpenWithClientId: () => {} }
  return ctx
}
