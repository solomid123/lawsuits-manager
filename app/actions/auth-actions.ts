"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/services/activity-service"

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return {
      error: "البريد الإلكتروني وكلمة المرور مطلوبان",
    }
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error: error.message,
    }
  }

  // تسجيل النشاط مع تجاهل الأخطاء
  if (data?.user) {
    try {
      await logActivity(data.user.id, "auth", "تم تسجيل الدخول", "user", data.user.id)
    } catch (error) {
      console.error("Error logging activity:", error)
      // تجاهل الخطأ والاستمرار
    }
  }

  redirect("/")
}

export async function signOut() {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // تسجيل النشاط مع تجاهل الأخطاء
  if (user) {
    try {
      await logActivity(user.id, "auth", "تم تسجيل الخروج", "user", user.id)
    } catch (error) {
      console.error("Error logging activity:", error)
      // تجاهل الخطأ والاستمرار
    }
  }

  await supabase.auth.signOut()
  redirect("/login")
}
