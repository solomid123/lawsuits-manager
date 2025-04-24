"use client"

import DashboardLayout from "./dashboard-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function NotFound() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <h2 className="mb-6 text-2xl">الصفحة غير موجودة</h2>
        <p className="mb-8 text-muted-foreground">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <Button asChild>
          <Link href="/">العودة إلى الصفحة الرئيسية</Link>
        </Button>
      </div>
    </DashboardLayout>
  )
} 