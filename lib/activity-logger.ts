'use server'

import { createClient } from '@/lib/supabase-server'

type ActivityLogParams = {
  action: 'create' | 'update' | 'delete' | 'view'
  entity_type: string
  entity_id: string
  description: string
  user_id: string
  metadata?: Record<string, any>
}

/**
 * Logs user activities to the activities table
 */
export async function logActivity(params: ActivityLogParams) {
  const {
    action,
    entity_type,
    entity_id,
    description,
    user_id,
    metadata = {}
  } = params

  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('activities')
      .insert({
        user_id,
        action_type: action,
        entity_type,
        entity_id,
        description,
        metadata,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging activity:', error)
    }
  } catch (error) {
    console.error('Unexpected error in logActivity:', error)
  }
} 