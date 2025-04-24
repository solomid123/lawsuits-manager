'use server'

import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-logger'

export type CasePartyFormData = {
  id?: string
  case_id: string
  name: string
  role: string
  type: string
  contact?: string
}

export async function addCaseParty(formData: CasePartyFormData) {
  const supabase = await createClient()

  // Required fields validation
  if (!formData.name || !formData.case_id) {
    return {
      error: 'Name and case ID are required fields'
    }
  }

  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    const { data, error } = await supabase
      .from('case_parties')
      .insert({
        case_id: formData.case_id,
        name: formData.name,
        role: formData.role,
        type: formData.type,
        contact: formData.contact || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding case party:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'create',
        entity_type: 'case_party',
        entity_id: data.id,
        description: `Added party ${formData.name} to case ${formData.case_id}`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${formData.case_id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in addCaseParty:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function updateCaseParty(formData: CasePartyFormData) {
  const supabase = await createClient()

  if (!formData.id) {
    return {
      error: 'Party ID is required for updates'
    }
  }

  // Required fields validation
  if (!formData.name) {
    return {
      error: 'Name is a required field'
    }
  }

  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    const { data, error } = await supabase
      .from('case_parties')
      .update({
        name: formData.name,
        role: formData.role,
        type: formData.type,
        contact: formData.contact || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', formData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating case party:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'update',
        entity_type: 'case_party',
        entity_id: formData.id,
        description: `Updated party ${formData.name}`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${formData.case_id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in updateCaseParty:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function deleteCaseParty(id: string, caseId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Get the party name before deletion for activity logging
    const { data: partyData } = await supabase
      .from('case_parties')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('case_parties')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting case party:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'delete',
        entity_type: 'case_party',
        entity_id: id,
        description: `Deleted party ${partyData?.name || id} from case ${caseId}`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${caseId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteCaseParty:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
} 