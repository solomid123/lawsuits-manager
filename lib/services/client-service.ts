import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getClients(search = "", limit = 10) {
  const supabase = createServerComponentClient({ cookies })

  let query = supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(limit)

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }

  return data
}

export async function getClientById(id: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching client:", error)
    return null
  }

  return data
}

export async function getClientCount() {
  const supabase = createServerComponentClient({ cookies })

  const { count, error } = await supabase.from("clients").select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error counting clients:", error)
    return 0
  }

  return count
}
