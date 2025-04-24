"use client"

import DashboardLayout from "../dashboard-layout"
import type { ReactNode } from "react"

export default function CatchAllLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
} 