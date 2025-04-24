import { supabaseClient } from './supabase-client'

// Database interface for calendar events
export const db = {
  // Fetch court sessions
  courtSession: {
    findMany: async ({ where }: { where: any }) => {
      if (!supabaseClient) return [];
      try {
        const { data, error } = await supabaseClient
          .from('court_sessions')
          .select(`
            id, 
            session_date,
            session_time, 
            notes,
            location,
            case_id,
            session_type,
            judge_name,
            status,
            cases (
              id,
              title
            )
          `)
          .gte('session_date', where.date.gte)
          .lte('session_date', where.date.lte)
        
        if (error) {
          console.error('Error fetching court sessions:', error)
          throw error
        }
        
        return data || []
      } catch (error) {
        console.error('Error in courtSession.findMany:', error)
        return []
      }
    }
  },
  
  // Fetch case events (milestones, tasks, etc.)
  caseEvent: {
    findMany: async ({ where }: { where: any }) => {
      if (!supabaseClient) return [];
      try {
        const { data, error } = await supabaseClient
          .from('case_events')
          .select(`
            id, 
            title,
            event_date, 
            event_type,
            description,
            is_milestone,
            is_decision,
            case_id,
            cases (
              id,
              title
            )
          `)
          .gte('event_date', where.date.gte)
          .lte('event_date', where.date.lte)
        
        if (error) {
          console.error('Error fetching case events:', error)
          throw error
        }
        
        return data || []
      } catch (error) {
        console.error('Error in caseEvent.findMany:', error)
        return []
      }
    }
  }
}

// Export the supabaseClient
export { supabaseClient } 