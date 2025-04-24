import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getCases(search = "", limit = 10) {
  const supabase = createServerComponentClient({ cookies })

  try {
    let query = supabase
      .from("cases")
      .select("*, clients(id, first_name, last_name, company_name), courts(id, name), case_types(id, name)")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (search) {
      query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching cases:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching cases:", error)
    return []
  }
}

export async function getCaseById(id: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const { data, error } = await supabase
      .from("cases")
      .select(
        "*, clients(id, first_name, last_name, company_name, email, phone), courts(id, name), case_types(id, name)",
      )
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching case:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching case:", error)
    return null
  }
}

export async function getCaseCount(status?: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    let query = supabase.from("cases").select("*", { count: "exact", head: true })

    if (status) {
      query = query.eq("status", status)
    }

    const { count, error } = await query

    if (error) {
      console.error("Error counting cases:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error counting cases:", error)
    return 0
  }
}

export async function getUpcomingSessions(limit = 5) {
  const supabase = createServerComponentClient({ cookies })

  try {
    const now = new Date().toISOString()

    // تصحيح استعلام SQL للحصول على الجلسات القادمة
    const { data, error } = await supabase
      .from("court_sessions")
      .select("*, cases(id, title, case_number, court_id, courts(id, name))")
      .gt("session_date", now)
      .order("session_date", { ascending: true })
      .limit(limit)

    if (error) {
      console.error("Error fetching upcoming sessions:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching upcoming sessions:", error)
    return []
  }
}

export async function getTodaySessions() {
  const supabase = createServerComponentClient({ cookies })

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data, error } = await supabase
      .from("court_sessions")
      .select("*")
      .gte("session_date", today.toISOString())
      .lt("session_date", tomorrow.toISOString())

    if (error) {
      console.error("Error fetching today's sessions:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error fetching today's sessions:", error)
    return []
  }
}
