"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormState } from "react-dom"
import { updateCourtSession } from "@/app/actions/court-session-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useParams, useRouter } from "next/navigation"

type CourtSession = {
  id: string;
  case_id: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
  notes: string | null;
  session_type: string | null;
  cases?: {
    title: string;
    case_number: string;
  };
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

// Create a wrapper for the server action to match the useFormState signature
const updateCourtSessionWithState = (prevState: ActionState, formData: FormData) => {
  return updateCourtSession(formData);
};

export default function EditCourtSessionPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<CourtSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, formAction] = useFormState(updateCourtSessionWithState, initialState);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("court_sessions")
          .select(`
            *,
            cases (
              title,
              case_number
            )
          `)
          .eq("id", sessionId)
          .single();

        if (error) throw error;
        
        if (data) {
          // Format date for input field
          let processedData = { ...data };
          if (processedData.session_date) {
            const date = new Date(processedData.session_date);
            const formattedDate = date.toISOString().split('T')[0];
            processedData.session_date = formattedDate;
          }
          
          setSession(processedData);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        toast.error("فشل في تحميل بيانات الجلسة");
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId, supabase]);

  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message || "تم تحديث الجلسة بنجاح");
      router.push(`/cases/sessions`);
    } else if (formState.errors?._form) {
      toast.error(formState.errors._form[0]);
      setIsSubmitting(false);
    }
  }, [formState, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Form action will be called automatically
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">تحميل...</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {Array(5).fill(0).map((_, index) => (
                <div key={index} className="h-10 bg-gray-200 animate-pulse rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">الجلسة غير موجودة</h1>
        </div>
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <p className="mb-4">الجلسة التي تبحث عنها غير موجودة أو تم حذفها.</p>
            <Button asChild>
              <Link href="/cases/sessions">العودة إلى قائمة الجلسات</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تعديل جلسة محكمة</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تفاصيل القضية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <span className="font-medium">اسم القضية:</span>
              <p>{session.cases?.title || "غير معروف"}</p>
            </div>
            <div>
              <span className="font-medium">رقم القضية:</span>
              <p>{session.cases?.case_number || "غير معروف"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">تعديل بيانات الجلسة</CardTitle>
        </CardHeader>
        <CardContent>
          {formState.errors?._form && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{formState.errors._form[0]}</AlertDescription>
            </Alert>
          )}
          
          <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="session-id" value={session.id} />
            <input type="hidden" name="case-id" value={session.case_id} />
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-date" className={formState.errors?.session_date ? "text-destructive" : ""}>
                  تاريخ الجلسة*
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="session-date" 
                    name="session-date" 
                    type="date" 
                    className={`pl-10 ${formState.errors?.session_date ? "border-destructive" : ""}`}
                    defaultValue={session.session_date}
                    required 
                  />
                </div>
                {formState.errors?.session_date && (
                  <p className="text-sm text-destructive">{formState.errors.session_date[0]}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-time" className={formState.errors?.session_time ? "text-destructive" : ""}>
                  وقت الجلسة*
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="session-time" 
                    name="session-time" 
                    type="time" 
                    className={`pl-10 ${formState.errors?.session_time ? "border-destructive" : ""}`} 
                    defaultValue={session.session_time || undefined}
                    required
                  />
                </div>
                {formState.errors?.session_time && (
                  <p className="text-sm text-destructive">{formState.errors.session_time[0]}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location" className={formState.errors?.location ? "text-destructive" : ""}>
                  المكان*
                </Label>
                <Input 
                  id="location" 
                  name="location" 
                  defaultValue={session.location || undefined} 
                  className={formState.errors?.location ? "border-destructive" : ""}
                  required
                />
                {formState.errors?.location && (
                  <p className="text-sm text-destructive">{formState.errors.location[0]}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-type">نوع الجلسة</Label>
                <Select name="session-type" defaultValue={session.session_type || "regular"}>
                  <SelectTrigger>
                    <SelectValue placeholder="عادية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">جلسة أولى</SelectItem>
                    <SelectItem value="regular">عادية</SelectItem>
                    <SelectItem value="appeal">استئناف</SelectItem>
                    <SelectItem value="final">ختامية</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  اختر نوع الجلسة (أولى، عادية، استئناف، ختامية). لا تضع المكان هنا.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                rows={3} 
                defaultValue={session.notes || undefined}
              />
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/cases/sessions")}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 