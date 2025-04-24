"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, Plus, Trash2, PenSquare, AlertTriangle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFormState } from "react-dom"
import { deleteCourtSession } from "@/app/actions/court-session-actions"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useParams, useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    case_id?: string[];
    session_date?: string[];
    session_time?: string[];
    location?: string[];
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

// Create wrapper for the server action to match the useFormState signature
const deleteCourtSessionWithState = (prevState: ActionState, formData: FormData) => {
  return deleteCourtSession(formData);
};

export default function CaseSessions() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [sessions, setSessions] = useState<Session[]>([]);
  const [caseDetails, setCaseDetails] = useState<{ title: string; case_number: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteFormState, formAction] = useFormState(deleteCourtSessionWithState, initialState);
  
  const supabase = createClientComponentClient();
  
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, get the case details
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("title, case_number")
        .eq("id", caseId)
        .single();
      
      if (caseError) {
        if (caseError.code === 'PGRST116') {
          // This is the "not found" error code from PostgREST
          setError("القضية غير موجودة أو تم حذفها");
        } else {
          console.error("Database error:", caseError);
          setError("فشل في تحميل بيانات القضية. الرجاء التحقق من الاتصال بقاعدة البيانات.");
        }
        return;
      }
      
      if (!caseData) {
        setError("القضية غير موجودة أو تم حذفها");
        return;
      }
      
      setCaseDetails(caseData);
      
      // Then, get all court sessions for this case
      const { data, error } = await supabase
        .from("court_sessions")
        .select("*")
        .eq("case_id", caseId)
        .order("session_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching sessions:", error);
        setError("فشل في تحميل جلسات القضية");
        return;
      }
      
      setSessions(data || []);
    } catch (err) {
      console.error("Error fetching case sessions:", err);
      setError("فشل في تحميل جلسات القضية. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (caseId) {
      fetchSessions();
    }
  }, [caseId]);
  
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
  
  // UI helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US");
  };
  
  const getSessionTypeDisplay = (type: string | null) => {
    if (!type) return "عادية";
    
    const types: Record<string, string> = {
      "first": "جلسة أولى",
      "regular": "عادية",
      "appeal": "استئناف",
      "final": "ختامية",
      // Handle Arabic values
      "جلسة أولى": "جلسة أولى",
      "عادية": "عادية",
      "استئناف": "استئناف",
      "ختامية": "ختامية"
    };
    
    return types[type] || "عادية";
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">جلسات المحكمة</h2>
          <Skeleton className="h-10 w-[150px]" />
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {Array(3).fill(0).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">جلسات المحكمة</h2>
        </div>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="mb-4">لا يمكن عرض جلسات هذه القضية.</p>
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
          <h2 className="text-xl font-bold">جلسات المحكمة</h2>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="mb-4">القضية غير موجودة أو تم حذفها.</p>
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
        <div>
          <h2 className="text-xl font-bold">جلسات المحكمة</h2>
          {caseDetails && (
            <p className="text-muted-foreground">
              القضية: {caseDetails.title} ({caseDetails.case_number})
            </p>
          )}
        </div>
        
        <Link href={`/cases/${caseId}/sessions/add`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            إضافة جلسة جديدة
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المكان</TableHead>
                  <TableHead className="text-right">الوقت</TableHead>
                  <TableHead className="text-right">الملاحظات</TableHead>
                  <TableHead className="text-right w-[100px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(3).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[80px] rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{formatDate(session.session_date)}</TableCell>
                      <TableCell>{getSessionTypeDisplay(session.session_type)}</TableCell>
                      <TableCell>{session.location || "—"}</TableCell>
                      <TableCell>{session.session_time || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {session.notes || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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
        </CardContent>
      </Card>
    </div>
  )
} 