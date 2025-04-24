"use client"

import type { ReactNode } from "react"

export default function CaseSessionsLayout({ children }: { children: ReactNode }) {
  // Remove DashboardLayout usage completely, as it's already provided by the parent layout
  return <>{children}</>
} 