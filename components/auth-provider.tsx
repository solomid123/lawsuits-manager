"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  
  // Initialize Supabase client
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setIsLoading(false)

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session)
          
          // Immediately handle navigation based on auth state change
          if (!session && pathname !== "/login") {
            router.push("/login")
          } else if (session && pathname === "/login") {
            router.push("/")
          }
        })

        return () => {
          authListener.subscription.unsubscribe()
        }
      } catch (error) {
        console.error("Error getting session:", error)
        setIsLoading(false)
      }
    }

    getSession()
  }, [supabase.auth, pathname, router])

  // Additional effect for pathname changes
  useEffect(() => {
    if (isLoading) return

    if (!session && pathname !== "/login") {
      router.push("/login")
    } else if (session && pathname === "/login") {
      router.push("/")
    }
  }, [session, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return children
}
