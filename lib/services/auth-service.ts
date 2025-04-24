import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

export async function getUser(): Promise<User | null> {
  const supabase = createServerComponentClient({ cookies })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function requireUser(): Promise<User> {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function getTeamMemberDetails(userId: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.from("team_members").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching team member details:", error)
    return null
  }

  return data
}
