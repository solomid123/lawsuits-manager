"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { updateCase } from "@/app/actions/case-actions"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Type definitions
interface CaseFormData {
  title: string;
  case_number: string;
  court_id: string;
  court_name: string;
  case_type: string;
  description: string;
  status: string;
  client_id: string | null;
  client_name: string;
  opponent_name: string;
  fee_amount: string;
  fee_type: string;
  priority: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
}

interface Court {
  id: string;
  name: string;
}

export default function EditCasePage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  
  const [formData, setFormData] = useState<CaseFormData>({
    title: "",
    case_number: "",
    court_id: "",
    court_name: "",
    case_type: "",
    description: "",
    status: "",
    client_id: null,
    client_name: "",
    opponent_name: "",
    fee_amount: "",
    fee_type: "percentage",
    priority: "normal",
  })
  
  const [clients, setClients] = useState<Client[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch case data
        const { data: caseData, error: caseError } = await supabase
          .from('cases')
          .select('*')
          .eq('id', caseId)
          .single()
          
        if (caseError) {
          console.error("Error fetching case:", caseError)
          setError("Failed to load case data. The case may not exist.")
          setLoading(false)
          return
        }
        
        if (!caseData) {
          setError("Case not found")
          setLoading(false)
          return
        }

        // Fetch clients for dropdown
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, company_name')
        
        if (clientsError) {
          console.error("Error fetching clients:", clientsError)
          toast.error("Failed to load clients")
          setClients([])
        } else {
          setClients(clientsData as Client[])
        }
        
        // Fetch courts for dropdown
        const { data: courtsData, error: courtsError } = await supabase
          .from('courts')
          .select('id, name')
        
        if (courtsError) {
          console.error("Error fetching courts:", courtsError)
          toast.error("Failed to load courts")
          setCourts([])
        } else {
          setCourts(courtsData as Court[])
        }

        // Find client name if client_id exists
        let clientName = ""
        if (caseData.client_id && clientsData) {
          const client = clientsData.find((c: Client) => c.id === caseData.client_id)
          if (client) {
            clientName = client.company_name || `${client.first_name} ${client.last_name}`
          }
        }

        // Find court name if court_id exists
        let courtName = ""
        if (caseData.court_id && courtsData) {
          const court = courtsData.find((c: Court) => c.id === caseData.court_id)
          if (court) {
            courtName = court.name
          }
        }

        // Set the form data
        setFormData({
          title: caseData.title || "",
          case_number: caseData.case_number || "",
          court_id: caseData.court_id || "",
          court_name: courtName,
          case_type: caseData.case_type || "",
          description: caseData.description || "",
          status: caseData.status || "",
          client_id: caseData.client_id,
          client_name: clientName,
          opponent_name: caseData.opponent_name || "",
          fee_amount: caseData.case_value?.toString() || "",
          fee_type: caseData.fee_type || "percentage",
          priority: caseData.priority || "normal",
        })
        
        // Debug logs
        console.log("Case data loaded:", caseData);
        console.log("Clients data loaded:", clientsData);
        console.log("Courts data loaded:", courtsData);
        console.log("Form data set:", formData);
      } catch (error) {
        console.error("Error:", error)
        setError("حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [caseId, supabase])
  
  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (client) {
      const clientName = client.company_name || `${client.first_name} ${client.last_name}`
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_name: clientName
      }))
    }
  }
  
  const handleCourtChange = (courtId: string) => {
    const court = courts.find(c => c.id === courtId)
    if (court) {
      setFormData(prev => ({
        ...prev,
        court_id: courtId,
        court_name: court.name
      }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate court selection
    if (!formData.court_id) {
      toast.error("يرجى اختيار المحكمة");
      return;
    }
    
    // Add logging to debug court name
    console.log("Court name before submission:", formData.court_name);
    console.log("Court ID before submission:", formData.court_id);
    
    setSubmitting(true);
    
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('case-id', caseId);
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('description', formData.description || '');
      formDataToSubmit.append('case-number', formData.case_number);
      formDataToSubmit.append('court-name', formData.court_name || '');
      formDataToSubmit.append('court-id', formData.court_id);
      formDataToSubmit.append('case-type', formData.case_type);
      formDataToSubmit.append('status', formData.status);
      formDataToSubmit.append('client-id', formData.client_id || '');
      formDataToSubmit.append('opponent-name', formData.opponent_name || '');
      formDataToSubmit.append('fee-amount', formData.fee_amount || '0');
      formDataToSubmit.append('fee-type', formData.fee_type);
      formDataToSubmit.append('priority', formData.priority);
      
      console.log("Form data being submitted:", Object.fromEntries(formDataToSubmit));
      console.log("Original case value:", formData.fee_amount);
      
      const result = await updateCase(formDataToSubmit);
      
      if ('error' in result && result.error) {
        toast.error(result.error);
      } else if ('success' in result && result.success) {
        toast.success("تم تحديث القضية بنجاح");
        router.push(`/cases/${caseId}`);
      } else {
        toast.error("حدث خطأ أثناء تحديث القضية");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("حدث خطأ أثناء تحديث القضية");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">تعديل القضية</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="mb-4">لا يمكن تحرير هذه القضية.</p>
            <Button asChild>
              <Link href="/cases">العودة إلى قائمة القضايا</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تعديل القضية</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Hidden field for "subject" validation */}
              <input 
                type="hidden" 
                name="subject" 
                id="subject" 
                value={formData.title} 
              />
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان القضية</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="case_number">رقم القضية</Label>
                  <Input
                    id="case_number"
                    value={formData.case_number}
                    onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="court_id">المحكمة</Label>
                  {courts.length > 0 ? (
                    <Select 
                      value={formData.court_id} 
                      onValueChange={handleCourtChange}
                    >
                      <SelectTrigger id="court_id">
                        <SelectValue placeholder="اختر محكمة" />
                      </SelectTrigger>
                      <SelectContent>
                        {courts.map((court) => (
                          <SelectItem key={court.id} value={court.id}>
                            {court.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.court_name}
                      onChange={(e) => setFormData({...formData, court_name: e.target.value})}
                      placeholder="أدخل اسم المحكمة"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="case_type">نوع القضية</Label>
                  <Select 
                    value={formData.case_type} 
                    onValueChange={(value) => setFormData({...formData, case_type: value})}
                  >
                    <SelectTrigger id="case_type">
                      <SelectValue placeholder="اختر نوع القضية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="civil">مدني</SelectItem>
                      <SelectItem value="commercial">تجاري</SelectItem>
                      <SelectItem value="criminal">جنائي</SelectItem>
                      <SelectItem value="labor">عمالي</SelectItem>
                      <SelectItem value="administrative">إداري</SelectItem>
                      <SelectItem value="other">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="client">الموكل</Label>
                  <Select 
                    value={formData.client_id || ''} 
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger id="client">
                      <SelectValue placeholder="اختر موكلاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company_name || `${client.first_name} ${client.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">حالة القضية</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="اختر حالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">جارية</SelectItem>
                      <SelectItem value="pending">معلقة</SelectItem>
                      <SelectItem value="closed">مغلقة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({...formData, priority: value})}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="اختر الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">عالية</SelectItem>
                      <SelectItem value="normal">عادية</SelectItem>
                      <SelectItem value="low">منخفضة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="opponent_name">الخصم</Label>
                  <Input
                    id="opponent_name"
                    value={formData.opponent_name}
                    onChange={(e) => setFormData({...formData, opponent_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fee_amount">قيمة القضية</Label>
                  <Input
                    id="fee_amount"
                    type="number"
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({...formData, fee_amount: e.target.value})}
                    placeholder="أدخل قيمة القضية"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fee_type">نوع الرسوم</Label>
                  <Select 
                    value={formData.fee_type} 
                    onValueChange={(value) => setFormData({...formData, fee_type: value})}
                  >
                    <SelectTrigger id="fee_type">
                      <SelectValue placeholder="اختر نوع الرسوم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button asChild variant="outline">
                  <Link href={`/cases/${caseId}`}>إلغاء</Link>
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 