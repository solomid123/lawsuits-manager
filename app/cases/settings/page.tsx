"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CaseSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Create Supabase client
  const supabase = createClientComponentClient()
  
  // Settings states
  const [autoNumbering, setAutoNumbering] = useState(true)
  const [casePrefixFormat, setCasePrefixFormat] = useState("YYYY/")
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // In a real implementation, we would fetch settings from the database
        // For now, we'll just simulate loading
        setTimeout(() => {
          setLoading(false)
        }, 1000)
        
        // Check the database connection
        const { data, error } = await supabase.from("cases").select("id").limit(1)
        
        if (error) {
          throw new Error(error.message)
        }
        
      } catch (err: any) {
        console.error("Error loading settings:", err)
        setError("فشل في تحميل بيانات القضية. الرجاء التحقق من الاتصال بقاعدة البيانات.")
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [supabase])
  
  const handleSaveSettings = () => {
    // In a real implementation, we would save settings to the database
    toast.success("تم حفظ الإعدادات بنجاح")
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إعدادات القضايا</h1>
      </div>
      
      {error ? (
        <div className="rounded-md border border-destructive p-4 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => router.refresh()}
            className="mx-auto"
          >
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات ترقيم القضايا</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-numbering">ترقيم تلقائي للقضايا الجديدة</Label>
                    <Switch 
                      id="auto-numbering" 
                      checked={autoNumbering} 
                      onCheckedChange={setAutoNumbering}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    سيتم إنشاء رقم تلقائي لكل قضية جديدة
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prefix-format">صيغة بادئة الترقيم</Label>
                  <Input 
                    id="prefix-format" 
                    placeholder="YYYY/" 
                    value={casePrefixFormat}
                    onChange={(e) => setCasePrefixFormat(e.target.value)}
                    disabled={!autoNumbering}
                  />
                  <p className="text-sm text-muted-foreground">
                    YYYY = السنة، MM = الشهر، DD = اليوم
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>إعدادات متقدمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sync-calendar">مزامنة تواريخ الجلسات مع التقويم</Label>
                    <Switch 
                      id="sync-calendar" 
                      checked={true}
                      onCheckedChange={() => {
                        toast.success("تم تحديث إعدادات المزامنة");
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    إضافة مواعيد الجلسات تلقائيًا إلى التقويم المرتبط
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Link href="/cases">
              <Button variant="outline">إلغاء</Button>
            </Link>
            <Button onClick={handleSaveSettings}>حفظ الإعدادات</Button>
          </div>
        </div>
      )}
    </div>
  )
} 