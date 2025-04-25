"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/actions/auth-actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function Header() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClientComponentClient()
  
  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      // Call server action for activity logging
      await signOut()
      
      // Use client-side auth for immediate effect
      await supabase.auth.signOut()
      
      // Force navigation to login page
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4">
      <div className="font-semibold">Lawsuits Manager</div>
      <div className="flex-1"></div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-white">UN</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>المستخدم</DropdownMenuLabel>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground"></DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <button 
              type="button" 
              className="w-full text-right" 
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "جاري تسجيل الخروج..." : "تسجيل الخروج"}
              </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
