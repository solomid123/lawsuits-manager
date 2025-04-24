"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from 'uuid'

const supabase = createClientComponentClient()

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'receipts')
 * @param folder Optional folder path within the bucket
 * @returns Object with the upload status and file path or error
 */
export async function uploadFile(
  file: File,
  bucket: string = 'receipts',
  folder: string = ''
): Promise<{ path: string | null; error: Error | null }> {
  try {
    console.log(`Starting file upload to bucket '${bucket}'${folder ? `, folder '${folder}'` : ''}`)
    console.log(`File: ${file.name}, type: ${file.type}, size: ${file.size} bytes`)
    
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName
    
    console.log(`Generated unique file path: ${filePath}`)

    // Upload the file to Supabase Storage
    console.log(`Uploading to Supabase Storage...`)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      console.error('Error details:', JSON.stringify(error))
      return { path: null, error }
    }

    console.log(`File uploaded successfully`, data)
    // Return the full path to the file
    return { path: data.path, error: null }
  } catch (error) {
    console.error('Error in uploadFile function:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', error)
    }
    return { path: null, error: error as Error }
  }
}

/**
 * Get a public URL for a file in Supabase Storage
 * @param path The file path in the storage bucket
 * @param bucket The storage bucket name (default: 'receipts')
 * @returns Promise that resolves to the public URL for the file or null if error
 */
export async function getFileUrl(path: string, bucket: string = 'receipts'): Promise<string | null> {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error('Error getting file URL:', error)
    return null
  }
}

/**
 * Delete a file from Supabase Storage
 * @param path The file path in the storage bucket
 * @param bucket The storage bucket name (default: 'receipts')
 * @returns Object with the deletion status and error (if any)
 */
export async function deleteFile(
  path: string,
  bucket: string = 'receipts'
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('Error deleting file:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteFile function:', error)
    return { success: false, error: error as Error }
  }
} 