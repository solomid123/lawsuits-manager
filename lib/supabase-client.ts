"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { type Database } from "@/lib/database.types"

// Define environment variables with fallbacks for better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kryioldnasxqiafrbyzs.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyeWlvbGRuYXN4cWlhZnJieXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDU5MzksImV4cCI6MjA2MDc4MTkzOX0.IvUvvVR3Jk2HyV7SONGLciLGAScOtV76YrIMPBtPwig";

// Create a singleton Supabase client for the frontend with proper environment variable checks
// This is to prevent errors during server-side rendering and build time
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// Only create the client in a browser environment
if (typeof window !== 'undefined') {
  try {
    supabaseClient = createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    });
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
  }
}

// Export the supabase client so it can be imported elsewhere
export { supabaseClient };

// Helper functions for data fetching

// Client count
export async function fetchClientCount() {
  if (!supabaseClient) return 0;

  const { count, error } = await supabaseClient
    .from("clients")
    .select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error fetching client count:", error)
    return 0
  }

  return count || 0
}

// Active cases count
export async function fetchActiveCaseCount() {
  if (!supabaseClient) return 0;

  const { count, error } = await supabaseClient
    .from("cases")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  if (error) {
    console.error("Error fetching active case count:", error)
    return 0
  }

  return count || 0
}

// Today's sessions count
export async function fetchTodaySessionsCount() {
  if (!supabaseClient) return 0;

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { count, error } = await supabaseClient
    .from("court_sessions")
    .select("*", { count: "exact", head: true })
    .gte("session_date", today.toISOString())
    .lt("session_date", tomorrow.toISOString())

  if (error) {
    console.error("Error fetching today's sessions count:", error)
    return 0
  }

  return count || 0
}

// Total sessions count
export async function fetchTotalSessionsCount() {
  if (!supabaseClient) return 0;

  const { count, error } = await supabaseClient
    .from("court_sessions")
    .select("*", { count: "exact", head: true })

  if (error) {
    console.error("Error fetching total sessions count:", error)
    return 0
  }

  return count || 0
}

// Recent activities
export async function fetchRecentActivities(limit = 4) {
  if (!supabaseClient) return [];

  const { data, error } = await supabaseClient
    .from("activities")
    .select("id, description, created_at, entity_type")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recent activities:", error)
    return []
  }

  return data || []
}

// Correct query with proper foreign key relationships and filter for only future sessions
export async function fetchUpcomingSessions(limit = 50) {
  if (!supabaseClient) return [];

  try {
    console.log("Starting upcoming court sessions fetch...");
    
    // Get current date to filter only future sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISOString = today.toISOString();
    
    console.log(`Filtering sessions from ${todayISOString} onwards`);
    
    // Query with proper relations and filter for only future sessions
    const { data, error } = await supabaseClient
      .from("court_sessions")
      .select(`
        id,
        session_date,
        session_time, 
        case_id,
        cases (
          id,
          title,
          client_id,
          clients (
            id,
            first_name,
            last_name,
            company_name
          )
        )
      `)
      .gte('session_date', todayISOString) // Only get sessions from today onwards
      .order("session_date", { ascending: true });

    if (error) {
      console.error("Error fetching court sessions:", error);
      return [];
    }

    console.log(`Fetched ${data?.length || 0} upcoming court sessions`);
    
    return data || [];
  } catch (err) {
    console.error("Error in fetchUpcomingSessions:", err);
    return [];
  }
}

// New function specifically for calendar that shows all sessions for the week
export async function fetchCalendarSessions(startDate: Date, endDate: Date) {
  if (!supabaseClient) return [];

  try {
    console.log("Starting calendar sessions fetch...");
    
    // Format dates for query
    const startISOString = startDate.toISOString();
    const endISOString = endDate.toISOString();
    
    console.log(`Fetching calendar sessions from ${startISOString} to ${endISOString}`);
    
    // Query with date range for the current week view
    const { data, error } = await supabaseClient
      .from("court_sessions")
      .select(`
        id,
        session_date,
        session_time, 
        case_id,
        cases (
          id,
          title,
          client_id,
          clients (
            id,
            first_name,
            last_name,
            company_name
          )
        )
      `)
      .gte('session_date', startISOString)
      .lte('session_date', endISOString)
      .order("session_date", { ascending: true });

    if (error) {
      console.error("Error fetching calendar sessions:", error);
      return [];
    }

    console.log(`Fetched ${data?.length || 0} calendar sessions for the week`);
    
    return data || [];
  } catch (err) {
    console.error("Error in fetchCalendarSessions:", err);
    return [];
  }
} 