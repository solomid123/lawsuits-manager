"use client"

import DashboardLayout from "../dashboard-layout"
import type { ReactNode } from "react"

export default function BillsLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
} 