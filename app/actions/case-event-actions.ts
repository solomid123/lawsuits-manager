"use server"

import { createClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/supabase-server'
import { logActivity } from '@/lib/activity-logger'
import { revalidatePath } from 'next/cache'

// Types for case event data
export type CaseEventFormData = {
  id?: string
  case_id: string
  event_date: string
  event_type: string
  title: string
  description?: string
  is_decision?: boolean
}

export type CaseEvent = {
  id: string
  case_id: string
  event_date: string
  event_type: string
  title: string
  description: string | null
  is_decision: boolean
  created_at: string
  updated_at: string | null
}

export async function addCaseEvent(formData: CaseEventFormData) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Validation
    if (!formData.case_id) {
      return {
        error: 'Case ID is required'
      }
    }

    if (!formData.event_date) {
      return {
        error: 'Event date is required'
      }
    }

    if (!formData.title) {
      return {
        error: 'Event title is required'
      }
    }

    if (!formData.event_type) {
      return {
        error: 'Event type is required'
      }
    }

    // Insert the event
    const { data, error } = await supabase
      .from('case_events')
      .insert({
        case_id: formData.case_id,
        event_date: formData.event_date,
        event_type: formData.event_type,
        title: formData.title,
        description: formData.description || null,
        is_decision: formData.is_decision || false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding case event:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'create',
        entity_type: 'case_event',
        entity_id: data.id,
        description: `Added event "${formData.title}" to case`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${formData.case_id}`)
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Unexpected error in addCaseEvent:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function updateCaseEvent(formData: CaseEventFormData) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Validation
    if (!formData.id) {
      return {
        error: 'Event ID is required for updates'
      }
    }

    if (!formData.case_id) {
      return {
        error: 'Case ID is required'
      }
    }

    if (!formData.event_date) {
      return {
        error: 'Event date is required'
      }
    }

    if (!formData.title) {
      return {
        error: 'Event title is required'
      }
    }

    if (!formData.event_type) {
      return {
        error: 'Event type is required'
      }
    }

    // Update the event
    const { data, error } = await supabase
      .from('case_events')
      .update({
        event_date: formData.event_date,
        event_type: formData.event_type,
        title: formData.title,
        description: formData.description || null,
        is_decision: formData.is_decision || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating case event:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'update',
        entity_type: 'case_event',
        entity_id: formData.id,
        description: `Updated event "${formData.title}" in case`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${formData.case_id}`)
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Unexpected error in updateCaseEvent:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function deleteCaseEvent(id: string, caseId: string) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Get the event title before deletion for activity logging
    const { data: eventData } = await supabase
      .from('case_events')
      .select('title')
      .eq('id', id)
      .single()

    // Delete the event
    const { error } = await supabase
      .from('case_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting case event:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'delete',
        entity_type: 'case_event',
        entity_id: id,
        description: `Deleted event "${eventData?.title || id}" from case`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${caseId}`)
    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error in deleteCaseEvent:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function getCaseEvents(caseId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('case_events')
      .select('*')
      .eq('case_id', caseId)
      .order('event_date', { ascending: false })
    
    if (error) {
      console.error('Error getting case events:', error)
      return {
        error: error.message
      }
    }
    
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Unexpected error in getCaseEvents:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
} 