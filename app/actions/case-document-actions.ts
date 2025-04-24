'use server'

import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-logger'

export type CaseDocumentFormData = {
  id?: string
  case_id: string
  name: string
  description?: string
  document_date?: string
  file_path?: string
  file_name?: string
  file_type?: string
  file_size?: number
}

export async function addCaseDocument(formData: CaseDocumentFormData) {
  const supabase = await createClient()
  
  try {
    console.log("Starting addCaseDocument action with data:", formData)
    
    // Required fields validation
    if (!formData.name || !formData.case_id) {
      console.error("Validation failed: Missing required fields")
      return {
        error: 'Name and case ID are required fields'
      }
    }

    try {
      // Get current user
      console.log("Getting current user...")
      const { user, error: userError } = await getCurrentUser()

      if (userError || !user) {
        console.error("Authentication error:", userError)
        return {
          error: 'Authentication error. Please try logging in again.'
        }
      }

      console.log("Inserting document into database...")
      const { data, error } = await supabase
        .from('case_documents')
        .insert({
          case_id: formData.case_id,
          name: formData.name,
          description: formData.description || null,
          document_date: formData.document_date || null,
          file_path: formData.file_path || null,
          file_name: formData.file_name || null,
          file_type: formData.file_type || null,
          file_size: formData.file_size || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding case document:', error)
        return {
          error: error.message
        }
      }

      console.log("Document inserted successfully:", data)

      // Log activity
      try {
        console.log("Logging activity...")
        await logActivity({
          user_id: user.id,
          action: 'create',
          entity_type: 'case_document',
          entity_id: data.id,
          description: `Added document ${formData.name} to case ${formData.case_id}`
        })
        console.log("Activity logged successfully")
      } catch (logError) {
        console.error('Error logging activity:', logError)
        // Continue even if logging fails
      }

      revalidatePath(`/cases/${formData.case_id}`)
      return { success: true, data }
    } catch (innerError: any) {
      console.error('Error in inner try block of addCaseDocument:', innerError)
      return {
        error: `Operation failed: ${innerError.message || 'Unknown error'}`
      }
    }
  } catch (error: any) {
    console.error('Unexpected error in addCaseDocument:', error)
    return {
      error: `An unexpected error occurred: ${error.message || 'Please try again.'}`
    }
  }
}

export async function updateCaseDocument(formData: CaseDocumentFormData) {
  const supabase = await createClient()
  
  if (!formData.id) {
    return {
      error: 'Document ID is required for updates'
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
      .from('case_documents')
      .update({
        name: formData.name,
        description: formData.description || null,
        document_date: formData.document_date || null,
        file_path: formData.file_path || null,
        file_name: formData.file_name || null,
        file_type: formData.file_type || null,
        file_size: formData.file_size || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', formData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating case document:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'update',
        entity_type: 'case_document',
        entity_id: formData.id,
        description: `Updated document ${formData.name}`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${formData.case_id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in updateCaseDocument:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function deleteCaseDocument(id: string, caseId: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Get the document name before deletion for activity logging
    const { data: documentData } = await supabase
      .from('case_documents')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('case_documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting case document:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'delete',
        entity_type: 'case_document',
        entity_id: id,
        description: `Deleted document ${documentData?.name || id} from case ${caseId}`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${caseId}`)
    return { success: true }
  } catch (error) {
    console.error('Unexpected error in deleteCaseDocument:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function getCaseDocument(id: string) {
  const supabase = await createClient()

  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    const { data, error } = await supabase
      .from('case_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error getting case document:', error)
      return {
        error: error.message
      }
    }

    if (!data) {
      return {
        error: 'Document not found'
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error in getCaseDocument:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
} 