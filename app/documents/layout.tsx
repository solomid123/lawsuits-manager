"use client"

import DashboardLayout from "../dashboard-layout"
import type { ReactNode } from "react"

export default function DocumentsLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
} 