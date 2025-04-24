"use server"

import { createClient, getCurrentUser } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-logger'

// Define type for case form data
export type CaseFormData = {
  id?: string
  title: string
  case_number?: string
  court_id?: string
  case_type: string
  client_id?: string
  status: string
  priority: string
  description?: string
  case_value?: number
}

// Define form state type to match what's expected by useActionState
export type CaseFormState = {
  error?: string;
  success?: boolean;
  caseId?: string;
  data?: any;
}

// Updated function signature to be compatible with useActionState
export async function createCase(prevState: CaseFormState, formData: FormData): Promise<CaseFormState> {
  console.log("Server action createCase started");
  const supabase = await createClient()
  
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      console.error("Authentication error in createCase:", userError);
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    console.log("User authenticated:", user.id);

    // Extract form data
    const title = formData.get('title') as string
    const caseNumber = formData.get('case-number') as string
    const courtName = formData.get('court-name') as string
    const courtId = formData.get('court-id') as string
    const caseType = formData.get('case-type') as string
    const clientId = formData.get('client-id') as string
    const status = formData.get('status') as string
    const priority = formData.get('priority') as string
    const description = formData.get('description') as string
    const feeAmount = formData.get('fee-amount') ? Number(formData.get('fee-amount')) : null
    const feeType = formData.get('fee-type') as string // Extracted but not currently stored in DB
    const opponentName = formData.get('opponent-name') as string // Extracted but not currently stored in DB
    const partiesJson = formData.get('parties') as string
    const documentsJson = formData.get('documents') as string

    // Generate a formatted case number if not provided
    const formattedCaseNumber = caseNumber || `${new Date().getFullYear()}/${Math.floor(Math.random() * 900) + 100}`;

    console.log("Form data extracted:", { 
      title, caseNumber: formattedCaseNumber, courtId, caseType, 
      clientId, status, priority, 
      hasParties: !!partiesJson, 
      hasDocuments: !!documentsJson 
    });

    // Validation
    if (!title) {
      console.error("Validation failed: Title is required");
      return {
        error: 'Title is required'
      }
    }

    console.log("Creating case in database...");
    const { data, error } = await supabase
      .from('cases')
      .insert({
        title,
        case_number: formattedCaseNumber,
        court_id: courtId || null,
        case_type: caseType,
        client_id: clientId || null,
        status,
        priority,
        description: description || null,
        case_value: feeAmount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating case:', error)
      return {
        error: error.message
      }
    }

    console.log("Case created successfully:", data.id);

    // Process parties if any
    if (partiesJson) {
      try {
        const parties = JSON.parse(partiesJson);
        console.log(`Processing ${parties.length} parties...`);
        
        // Insert each party into the database
        for (const party of parties) {
          const { error: partyError } = await supabase
            .from('case_parties')
            .insert({
              case_id: data.id,
              name: party.name,
              role: party.role,
              type: party.type,
              contact: party.contact || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (partyError) {
            console.error('Error inserting party:', partyError);
          } else {
            console.log(`Party "${party.name}" inserted successfully`);
          }
        }
      } catch (e) {
        console.error("Error processing parties:", e);
      }
    }

    // Process documents if any
    if (documentsJson) {
      try {
        const documents = JSON.parse(documentsJson);
        console.log(`Processing ${documents.length} documents...`);
        
        // Insert each document into the database
        for (const doc of documents) {
          const { error: docError } = await supabase
            .from('case_documents')
            .insert({
              case_id: data.id,
              name: doc.name,
              description: doc.description || null,
              document_date: doc.date || null,
              file_path: doc.file_path || null,
              file_name: doc.file_name || null,
              file_type: doc.file_type || null,
              file_size: doc.file_size || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (docError) {
            console.error('Error inserting document:', docError);
          } else {
            console.log(`Document "${doc.name}" inserted successfully`);
          }
        }
      } catch (e) {
        console.error("Error processing documents:", e);
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'create',
        entity_type: 'case',
        entity_id: data.id,
        description: `Created case "${title}"`
      })
      console.log("Activity logged successfully");
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    console.log("Server action completed successfully");
    return {
      success: true,
      caseId: data.id,
      data
    }
  } catch (error) {
    console.error('Unexpected error in createCase:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function updateCase(formData: FormData) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Extract form data
    const id = formData.get('case-id') as string
    const title = formData.get('title') as string
    const caseNumber = formData.get('case-number') as string
    const courtName = formData.get('court-name') as string
    const courtId = formData.get('court-id') as string
    const caseType = formData.get('case-type') as string
    const clientId = formData.get('client-id') as string
    const status = formData.get('status') as string
    const priority = formData.get('priority') as string
    const description = formData.get('description') as string
    const feeAmount = formData.get('fee-amount') ? Number(formData.get('fee-amount')) : null
    const feeType = formData.get('fee-type') as string // Extracted but not currently stored in DB
    const opponentName = formData.get('opponent-name') as string // Extracted but not currently stored in DB

    // Validation
    if (!id) {
      return {
        error: 'Case ID is required for updates'
      }
    }

    if (!title) {
      return {
        error: 'Title is required'
      }
    }

    const { data, error } = await supabase
      .from('cases')
      .update({
        title,
        case_number: caseNumber || null,
        court_id: courtId || null,
        case_type: caseType,
        client_id: clientId || null,
        status,
        priority,
        description: description || null,
        case_value: feeAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating case:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'update',
        entity_type: 'case',
        entity_id: id,
        description: `Updated case "${title}"`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    revalidatePath(`/cases/${id}`)
    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Unexpected error in updateCase:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function deleteCase(id: string) {
  const supabase = await createClient()
  
  try {
    // Get current user
    const { user, error: userError } = await getCurrentUser()

    if (userError || !user) {
      return {
        error: 'Authentication error. Please try logging in again.'
      }
    }

    // Get the case title before deletion for activity logging
    const { data: caseData } = await supabase
      .from('cases')
      .select('title')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting case:', error)
      return {
        error: error.message
      }
    }

    // Log activity
    try {
      await logActivity({
        user_id: user.id,
        action: 'delete',
        entity_type: 'case',
        entity_id: id,
        description: `Deleted case "${caseData?.title || id}"`
      })
    } catch (logError) {
      console.error('Error logging activity:', logError)
      // Continue even if logging fails
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Unexpected error in deleteCase:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
} 