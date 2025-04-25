"use client"

import { useState, useEffect } from "react"
import { signIn } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        router.push("/")
      }
    }
    
    checkAuth()
  }, [supabase, router])

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      
      if (!email || !password) {
        setError("البريد الإلكتروني وكلمة المرور مطلوبان")
        return
      }
      
      // First call the server action to log the activity
      const result = await signIn({}, formData)
      
      if (result.error) {
        setError(result.error)
        return
      }
      
      // If server action succeeded, manually check auth session
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // Force navigation to dashboard
        router.push("/")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.")
    } finally {
    setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بيانات الاعتماد الخاصة بك للوصول إلى نظام إدارة القضايا</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required dir="ltr" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Button variant="link" className="h-auto p-0 text-sm" type="button">
                  نسيت كلمة المرور؟
                </Button>
              </div>
              <Input id="password" name="password" type="password" required dir="ltr" />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p className="w-full">هذا النظام مخصص للمستخدمين المصرح لهم فقط. يرجى التواصل مع المسؤول لإنشاء حساب جديد.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
