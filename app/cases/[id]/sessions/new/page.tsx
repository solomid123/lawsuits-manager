"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

export default function NewSessionRedirect({ params }: { params: { id: string } }) {
  // Safely access the ID from params
  const router = useRouter()
  
  // Use useEffect to perform the redirect client-side
  useEffect(() => {
    // Safely create the target URL
    const caseId = params?.id || ''
    const targetUrl = `/cases/${caseId}/sessions/add`
    
    // Navigate to the target URL
    router.push(targetUrl)
  }, [params, router])
  
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mb-4"></div>
      <p className="text-gray-500">جاري التحويل...</p>
    </div>
  )
} 