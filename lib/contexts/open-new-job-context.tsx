'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type OpenNewJobContextValue = {
  openWithClientId: string | null
  setOpenWithClientId: (clientId: string | null) => void
  /** Increments when something (dashboard quick action, command palette) requests the schedule job sheet. */
  newJobOpenRequest: number
  requestNewJobSheet: () => void
}

const OpenNewJobContext = createContext<OpenNewJobContextValue | null>(null)

export function OpenNewJobProvider({ children }: { children: React.ReactNode }) {
  const [openWithClientId, setOpenWithClientId] = useState<string | null>(null)
  const [newJobOpenRequest, setNewJobOpenRequest] = useState(0)
  const requestNewJobSheet = useCallback(() => {
    setNewJobOpenRequest((n) => n + 1)
  }, [])

  return (
    <OpenNewJobContext.Provider
      value={{ openWithClientId, setOpenWithClientId, newJobOpenRequest, requestNewJobSheet }}
    >
      {children}
    </OpenNewJobContext.Provider>
  )
}

export function useOpenNewJob() {
  const ctx = useContext(OpenNewJobContext)
  if (!ctx) {
    return {
      openWithClientId: null,
      setOpenWithClientId: () => {},
      newJobOpenRequest: 0,
      requestNewJobSheet: () => {},
    }
  }
  return ctx
}
