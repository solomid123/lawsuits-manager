'use server'

import { createServerActionClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { type Database } from './database.types'

/**
 * Creates a Supabase client for server components and server actions
 * This is used for server-side operations like data fetching and mutations
 */
export async function createClient() {
  const cookieStore = cookies()
  return createServerActionClient<Database>({ cookies: () => cookieStore })
}

/**
 * Creates a Supabase client specifically for server components
 * Use this when you're sure you're in a server component context
 */
export async function createServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

/**
 * Gets the current user with error handling
 * This is a helper function to simplify auth checking in server actions
 * @returns An object with user (if authenticated) and error (if any)
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return { user: null, error }
    }
    
    return { user: data.user, error: null }
  } catch (error) {
    console.error('Unexpected error getting current user:', error)
    return { 
      user: null, 
      error: new Error('Failed to get current user')
    }
  }
} 