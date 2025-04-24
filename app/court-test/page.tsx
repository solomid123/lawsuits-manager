"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import DashboardLayout from "../dashboard-layout"

type Court = {
  id: string;
  name?: string;
  court_type?: string;
}

export default function CourtTestPage() {
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourt, setSelectedCourt] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  
  const fetchCourts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Fetching courts...')
      const { data, error } = await supabase
        .from('courts')
        .select('id, name, court_type')
      
      if (error) {
        throw error
      }
      
      console.log('Courts data:', data)
      setCourts(data || [])
    } catch (err: any) {
      console.error('Error fetching courts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchCourts()
  }, [])
  
  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-right">اختبار المحاكم</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <Button onClick={fetchCourts} disabled={loading}>
              {loading ? 'جاري التحميل...' : 'تحديث البيانات'}
            </Button>
            
            <p className="text-sm text-gray-500">
              {loading ? 'جاري تحميل البيانات...' : `تم العثور على ${courts.length} محكمة`}
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="court-select" className="block text-sm font-medium text-gray-700 text-right">
              اختر محكمة
            </label>
            
            <Select
              value={selectedCourt}
              onValueChange={setSelectedCourt}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر محكمة" />
              </SelectTrigger>
              <SelectContent>
                {courts.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    لا توجد محاكم متاحة
                  </SelectItem>
                ) : (
                  courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name || court.court_type || 'محكمة بدون اسم'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-right">بيانات المحاكم الخام:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-80 text-xs">
              {JSON.stringify(courts, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 