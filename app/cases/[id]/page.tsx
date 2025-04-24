"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Building, Calendar, Edit, User, Plus, PenSquare, Trash2, AlertTriangle, FileText } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { useActionState } from "react"
import { deleteCourtSession } from "@/app/actions/court-session-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DocumentViewer from "@/app/components/DocumentViewer"
import CaseTimeline from "@/app/components/CaseTimeline"
import { deleteCaseDocument } from "@/app/actions/case-document-actions"

type CaseDetails = {
  id: string;
  title: string;
  case_number: string;
  description: string | null;
  client_id: string;
  court_id: string;
  status: string;
  case_type: string;
  case_value: number | null;
  priority: string;
  next_session_date: string | null;
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string | null;
  };
  courts?: {
    id: string;
    name: string;
    location: string | null;
  };
  documents?: Array<{
    id: string;
    name: string;
    description?: string | null;
    document_date?: string | null;
    file_path?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    file_size?: number | null;
    created_at: string;
  }>;
  fee_type?: string | null;
};

type Session = {
  id: string;
  case_id: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  session_type: string | null;
};

type ActionState = {
  errors?: {
    _form?: string[];
  };
  message?: string | null;
  success?: boolean;
};

const initialState: ActionState = {
  errors: undefined,
  message: null,
  success: false
};

// Create wrapper for the delete court session action
const deleteCourtSessionWithState = (prevState: ActionState, formData: FormData) => {
  return deleteCourtSession(formData);
};

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [nextSession, setNextSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documents, setDocuments] = useState<CaseDetails['documents']>([]);
  const [activeTab, setActiveTab] = useState("sessions");
  const [deleteFormState, formAction] = useActionState(deleteCourtSessionWithState, initialState);
  
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // Get the tab from URL query parameters
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    
    // If a valid tab is specified in the URL, set it as active
    if (tabParam && ['sessions', 'documents', 'timeline', 'notes'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  useEffect(() => {
    async function fetchCaseDetails() {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from("cases")
          .select(`
            *,
            clients (*),
            courts (*)
          `)
          .eq("id", caseId)
          .single();
          
        if (error) {
          if (error.code === 'PGRST116') {
            // This is the "not found" error code from PostgREST
            setError("القضية غير موجودة أو تم حذفها");
          } else {
            console.error("Database error:", error);
            setError("فشل في تحميل بيانات القضية. الرجاء التحقق من الاتصال بقاعدة البيانات.");
          }
          return;
        }
        
        if (!data) {
          setError("القضية غير موجودة أو تم حذفها");
          return;
        }
        
        // Enhance data with inferred fee_type based on the value
        const enhancedData = {
          ...data,
          // If the case_value is more than 100, it's likely a fixed amount, otherwise it's a percentage
          fee_type: data.case_value && data.case_value > 100 ? "fixed" : "percentage"
        };
        
        setCaseDetails(enhancedData);
        console.log("Case details fetched:", {
          title: enhancedData.title,
          case_value: enhancedData.case_value,
          fee_type: enhancedData.fee_type,
          formatted_value: formatMoney(enhancedData.case_value)
        });
        
        // Fetch sessions and documents only after we've confirmed the case exists
        fetchSessions();
        fetchDocuments();
      } catch (error) {
        console.error("Error fetching case:", error);
        setError("فشل في تحميل بيانات القضية. يرجى المحاولة مرة أخرى.");
      } finally {
        setLoading(false);
      }
    }
    
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId, supabase]);
  
  async function fetchSessions() {
    setSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("court_sessions")
        .select("*")
        .eq("case_id", caseId)
        .order("session_date", { ascending: false });
        
      if (error) {
        console.error("Error fetching sessions:", error);
        toast.error("فشل في تحميل جلسات المحكمة");
        return;
      }
      
      console.log("Session data retrieved:", data);
      
      // Use the data directly without preprocessing
      setSessions(data || []);
      
      // Find next session (future session with earliest date)
      if (data && data.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureSessions = data
          .filter(session => new Date(session.session_date) >= today)
          .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
          
        if (futureSessions.length > 0) {
          setNextSession(futureSessions[0]);
          console.log("Next session identified:", futureSessions[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("فشل في تحميل جلسات المحكمة");
    } finally {
      setSessionsLoading(false);
    }
  }
  
  async function fetchDocuments() {
    setDocumentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("case_documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching documents:", error);
        toast.error("فشل في تحميل المستندات");
        return;
      }
      
      console.log("Document data retrieved:", data);
      setDocuments(data || []);
      
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("فشل في تحميل المستندات");
    } finally {
      setDocumentsLoading(false);
    }
  }
  
  useEffect(() => {
    if (deleteFormState.success) {
      toast.success(deleteFormState.message || "تم حذف الجلسة بنجاح");
      fetchSessions();
    } else if (deleteFormState.errors?._form) {
      toast.error(deleteFormState.errors._form[0]);
    }
  }, [deleteFormState]);
  
  const handleDeleteSession = (sessionId: string) => {
    if (confirm(`هل أنت متأكد من حذف الجلسة؟`)) {
      const formData = new FormData();
      formData.append("session-id", sessionId);
      formData.append("case-id", caseId);
      
      formAction(formData);
    }
  };
  
  const handleDeleteDocument = async (documentId: string) => {
    if (confirm(`هل أنت متأكد من حذف هذا المستند؟`)) {
      try {
        const result = await deleteCaseDocument(documentId, caseId);
        if (result.success) {
          toast.success("تم حذف المستند بنجاح");
          fetchDocuments();
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("حدث خطأ أثناء حذف المستند");
      }
    }
  };
  
  // UI Helpers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    // Use en-US locale for numbers but keep Arabic formatting for month/day names
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };
  
  const formatDateTime = (dateString: string | null, timeString: string | null) => {
    if (!dateString) return "—";
    
    // Use en-US locale for numbers but keep Arabic formatting for month/day names
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    
    return timeString ? `${formattedDate} - ${timeString}` : formattedDate;
  };
  
  const formatMoney = (amount: number | null) => {
    if (amount === null) return "—";
    
    // Check the fee type (if it exists in caseDetails)
    const feeType = caseDetails?.fee_type || "fixed";
    
    if (feeType === "percentage") {
      // For percentage, display number with % symbol
      return `${amount}%`;
    } else {
      // For fixed amount, use the MAD currency
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "MAD",
        maximumFractionDigits: 0,
      }).format(amount);
    }
  };
  
  const getClientName = (caseInfo: CaseDetails | null) => {
    if (!caseInfo?.clients) return "—";
    
    const client = caseInfo.clients;
    return client.company_name || `${client.first_name} ${client.last_name}`;
  };
  
  const getSessionTypeDisplay = (type: string | null) => {
    // If no type provided, return "عادية" (regular)
    if (!type) {
      return "عادية";
    }
    
    // Direct mapping of valid types
    switch (type) {
      case "first": return "جلسة أولى";
      case "appeal": return "استئناف";
      case "final": return "ختامية";
      case "regular": return "عادية";
      // Handle Arabic values that might be stored directly
      case "جلسة أولى": return "جلسة أولى";
      case "استئناف": return "استئناف";
      case "ختامية": return "ختامية";
      case "عادية": return "عادية";
      default: return "عادية";
    }
  };
  
  // Format document date
  const formatDocumentDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4).fill(0).map((_, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-5 w-[120px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">القضية غير موجودة</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="mb-4">القضية التي تبحث عنها غير موجودة أو تم حذفها.</p>
            <Button asChild>
              <Link href="/cases">العودة إلى قائمة القضايا</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!caseDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">القضية غير موجودة</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="mb-4">القضية التي تبحث عنها غير موجودة أو تم حذفها.</p>
            <Button asChild>
              <Link href="/cases">العودة إلى قائمة القضايا</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{caseDetails.title}</h1>
        <Link href={`/cases/${caseId}/edit`}>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            تعديل القضية
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المحكمة</p>
              <p className="font-medium">{caseDetails.courts?.name || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الجلسة القادمة</p>
              <p className="font-medium">
                {nextSession ? formatDateTime(nextSession.session_date, nextSession.session_time) : formatDate(caseDetails.next_session_date)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الموكل</p>
              <p className="font-medium">{getClientName(caseDetails)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">قيمة القضية</p>
              <p className="font-medium">{(() => {
                console.log("Rendering case value:", caseDetails.case_value, "fee type:", caseDetails.fee_type);
                return formatMoney(caseDetails.case_value);
              })()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الجلسات القادمة</p>
              <p className="font-medium">{sessions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">الجلسات</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
          <TabsTrigger value="timeline">الجدول الزمني</TabsTrigger>
          <TabsTrigger value="notes">نظرة عامة</TabsTrigger>
        </TabsList>
        <TabsContent value="sessions" className="border rounded-md mt-4">
          <div className="p-4 flex justify-end">
            <Link href={`/cases/${caseId}/sessions/add`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                إضافة جلسة
              </Button>
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right w-[15%]">التاريخ</TableHead>
                  <TableHead className="text-right w-[10%]">النوع</TableHead>
                  <TableHead className="text-right w-[20%]">المكان</TableHead>
                  <TableHead className="text-right w-[10%]">الوقت</TableHead>
                  <TableHead className="text-right w-[30%]">الملاحظات</TableHead>
                  <TableHead className="text-right w-[15%]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-right w-[15%]"><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell className="text-right w-[10%]"><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell className="text-right w-[20%]"><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell className="text-right w-[10%]"><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell className="text-right w-[30%]"><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell className="text-right w-[15%]"><Skeleton className="h-9 w-[100px] rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="text-right w-[15%]">{formatDate(session.session_date)}</TableCell>
                      <TableCell className="text-right w-[10%]">{getSessionTypeDisplay(session.session_type)}</TableCell>
                      <TableCell className="text-right w-[20%]">{session.location || "—"}</TableCell>
                      <TableCell className="text-right w-[10%]">{session.session_time || "—"}</TableCell>
                      <TableCell className="text-right w-[30%] truncate">
                        {session.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right w-[15%]">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/cases/${caseId}/sessions/${session.id}/edit`}>
                            <Button variant="ghost" size="icon">
                              <PenSquare className="h-4 w-4" />
                              <span className="sr-only">تعديل</span>
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا توجد جلسات محكمة لهذه القضية
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {sessions.length > 3 && (
            <div className="p-4 flex justify-center">
              <Link href={`/cases/${caseId}/sessions`}>
                <Button variant="outline" size="sm">
                  عرض كل الجلسات
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
        <TabsContent value="documents" className="border rounded-md mt-4">
          <div className="p-4 flex justify-end">
            <Link href={`/cases/${caseId}/documents/add`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                إضافة مستند
              </Button>
            </Link>
          </div>
          
          {documentsLoading ? (
            <div className="p-8">
              <div className="space-y-4">
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-6 w-[200px]" />
                      <Skeleton className="h-8 w-[100px]" />
                    </div>
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="p-8 space-y-6">
              {documents.map((document) => (
                <div key={document.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{document.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {document.document_date ? formatDocumentDate(document.document_date) : ""}
                        {document.description && <> • {document.description}</>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cases/${caseId}/documents/${document.id}/edit`}>
                          <PenSquare className="mr-2 h-4 w-4" />
                          تعديل
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                  
                  {document.file_path ? (
                    <DocumentViewer
                      filePath={document.file_path}
                      fileName={document.file_name || undefined}
                      fileType={document.file_type || undefined}
                      fileSize={document.file_size || undefined}
                    />
                  ) : (
                    <div className="bg-muted rounded-md p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">لا يوجد ملف مرفق</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد مستندات مضافة بعد. انقر على زر "إضافة مستند" لإضافة مستند جديد.
            </div>
          )}
        </TabsContent>
        <TabsContent value="timeline">
          <CaseTimeline caseId={caseId} />
        </TabsContent>
        <TabsContent value="notes">
          <div className="border rounded-md p-8 text-center text-muted-foreground">
            {caseDetails.description || "لا توجد ملاحظات مضافة بعد"}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
