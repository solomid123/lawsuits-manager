"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, User, Mail, Phone, Building, Calendar, Edit, Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

type Client = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company_name: string | null
  created_at: string
  address: string | null
  notes: string | null
}

type Case = {
  id: string
  title: string
  status: string
  created_at: string
}

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null)
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchClientDetails = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("*")
          .eq("id", params.id)
          .single()

        if (clientError) throw clientError

        setClient(clientData)

        // Fetch cases related to this client
        const { data: casesData, error: casesError } = await supabase
          .from("cases")
          .select("id, title, status, created_at")
          .eq("client_id", params.id)
          .order("created_at", { ascending: false })

        if (casesError) throw casesError

        setCases(casesData || [])
      } catch (err) {
        console.error("Error fetching client details:", err)
        setError("فشل في جلب بيانات العميل. الرجاء المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }

    fetchClientDetails()
  }, [params.id, supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-[500px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-full max-w-[300px]" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">عودة</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mr-2">تفاصيل العميل</h1>
        </div>
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {error || "لم يتم العثور على العميل"}
          </p>
          <Link href="/clients">
            <Button variant="default">العودة للقائمة</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const fullName = `${client.first_name} ${client.last_name}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/clients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">عودة</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold mr-2">{fullName}</h1>
        </div>
        <Link href={`/clients/${params.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">البيانات الشخصية</TabsTrigger>
          <TabsTrigger value="cases">القضايا</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات العميل</CardTitle>
              <CardDescription>تفاصيل الاتصال والمعلومات الأساسية للعميل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الاسم</p>
                    <p className="font-medium">{fullName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium">{client.email || "غير متوفر"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium" dir="ltr">{client.phone || "غير متوفر"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">الشركة</p>
                    <p className="font-medium">{client.company_name || "غير متوفر"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإضافة</p>
                    <p className="font-medium">
                      {format(new Date(client.created_at), 'PPP', { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
              
              {client.address && (
                <div>
                  <h3 className="text-sm font-medium mb-2">العنوان</h3>
                  <p className="text-muted-foreground">{client.address}</p>
                </div>
              )}
              
              {client.notes && (
                <div>
                  <h3 className="text-sm font-medium mb-2">ملاحظات</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cases" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>القضايا</CardTitle>
                  <CardDescription>القضايا المرتبطة بهذا العميل</CardDescription>
                </div>
                <Link href={`/cases/new?client=${params.id}`}>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    إضافة قضية
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {cases.length > 0 ? (
                <div className="space-y-4">
                  {cases.map((caseItem) => (
                    <Link href={`/cases/${caseItem.id}`} key={caseItem.id}>
                      <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors">
                        <div>
                          <p className="font-medium">{caseItem.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(caseItem.created_at), 'PPP', { locale: ar })}
                          </p>
                        </div>
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-full ${
                            caseItem.status === 'active' ? 'bg-green-100 text-green-800' :
                            caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            caseItem.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            ''
                          }`}>
                            {caseItem.status === 'active' ? 'نشطة' :
                            caseItem.status === 'pending' ? 'معلقة' :
                            caseItem.status === 'closed' ? 'مغلقة' :
                            caseItem.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">لا توجد قضايا مرتبطة بهذا العميل</p>
                  <Link href={`/cases/new?client=${params.id}`}>
                    <Button>إضافة قضية جديدة</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 