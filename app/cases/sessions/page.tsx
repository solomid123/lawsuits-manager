"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, Search, Plus, Trash2, PenSquare, RefreshCw, ExternalLink, Pencil, Filter, SlidersHorizontal, X, Check } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormState } from "react-dom"
import { addCourtSession, deleteCourtSession } from "@/app/actions/court-session-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Case = {
  id: string;
  title: string;
  case_number: string;
  client_id: string;
  clients?: {
    first_name: string;
    last_name: string;
    company_name: string | null;
  } | {
    first_name: string;
    last_name: string;
    company_name: string | null;
  }[];
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
  cases?: {
    title: string;
    case_number: string;
    clients?: {
      first_name: string;
      last_name: string;
      company_name: string | null;
    };
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

// Create wrappers for the server actions to match the useFormState signature
const addCourtSessionWithState = (prevState: ActionState, formData: FormData) => {
  return addCourtSession(formData);
};

const deleteCourtSessionWithState = (prevState: ActionState, formData: FormData) => {
  return deleteCourtSession(formData);
};

export default function AllSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "case_title" | "case_number" | "client">("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [availableSessionTypes, setAvailableSessionTypes] = useState<string[]>([]);
  
  const supabase = createClientComponentClient();
  
  const fetchSessions = async (search = "") => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching sessions with search:", search, "filters:", { sessionType: sessionTypeFilter });
      
      // Build the main query
      let query = supabase
        .from("court_sessions")
        .select(`
          *,
          cases (
            id,
            title,
            case_number,
            clients (
              id,
              first_name,
              last_name,
              company_name
            )
          )
        `)
        .order("session_date", { ascending: false });
      
      // Apply session type filter
      if (sessionTypeFilter.length > 0) {
        query = query.in("session_type", sessionTypeFilter);
      }
      
      // Apply search filters
      if (search) {
        if (searchType === "all") {
          // For "all" search, we need to first find cases matching the title, case number or client
          const { data: matchingCases } = await supabase
            .from("cases")
            .select("id")
            .or(`title.ilike.%${search}%,case_number.ilike.%${search}%`);
          
          // Find clients matching the search
          const { data: matchingClients } = await supabase
            .from("clients")
            .select("id")
            .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
          
          // Get cases with matching clients
          const { data: casesWithMatchingClients } = await supabase
            .from("cases")
            .select("id")
            .in("client_id", matchingClients?.map(client => client.id) || []);
          
          // Combine all matching case IDs
          const matchingCaseIds = [
            ...(matchingCases?.map(c => c.id) || []),
            ...(casesWithMatchingClients?.map(c => c.id) || [])
          ];
          
          // Filter sessions by matching case IDs or by location
          if (matchingCaseIds.length > 0) {
            query = query.or(`case_id.in.(${matchingCaseIds.join(',')}),location.ilike.%${search}%`);
          } else {
            // If no matching cases, just search in location
            query = query.ilike("location", `%${search}%`);
          }
        } else if (searchType === "case_title") {
          // Find cases matching the title
          const { data: matchingCases } = await supabase
            .from("cases")
            .select("id")
            .ilike("title", `%${search}%`);
          
          const caseIds = matchingCases?.map(c => c.id) || [];
          
          if (caseIds.length > 0) {
            query = query.in("case_id", caseIds);
          } else {
            query = query.eq("id", "no-match-placeholder");
          }
        } else if (searchType === "case_number") {
          // Find cases matching the case number
          const { data: matchingCases } = await supabase
            .from("cases")
            .select("id")
            .ilike("case_number", `%${search}%`);
          
          const caseIds = matchingCases?.map(c => c.id) || [];
          
          if (caseIds.length > 0) {
            query = query.in("case_id", caseIds);
          } else {
            query = query.eq("id", "no-match-placeholder");
          }
        } else if (searchType === "client") {
          // Find clients matching the search
          const { data: matchingClients } = await supabase
            .from("clients")
            .select("id")
            .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
          
          // Get cases with matching clients
          const { data: matchingCases } = await supabase
            .from("cases")
            .select("id")
            .in("client_id", matchingClients?.map(client => client.id) || []);
          
          const caseIds = matchingCases?.map(c => c.id) || [];
          
          if (caseIds.length > 0) {
            query = query.in("case_id", caseIds);
          } else {
            query = query.eq("id", "no-match-placeholder");
          }
        }
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Extract all unique session types
      if (data) {
        const uniqueSessionTypes = Array.from(new Set(data.map(s => s.session_type))).filter(Boolean) as string[];
        setAvailableSessionTypes(uniqueSessionTypes);
      }
      
      setSessions(data || []);
      
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("فشل في جلب الجلسات. الرجاء المحاولة مرة أخرى لاحقاً.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSessions();
  }, [sessionTypeFilter]); // Re-fetch when filters change
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions(searchQuery);
  };
  
  const resetFilters = () => {
    setSessionTypeFilter([]);
    setFilterOpen(false);
  };

  const getActiveFiltersCount = () => {
    return sessionTypeFilter.length;
  };

  const toggleSessionTypeFilter = (type: string) => {
    setSessionTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(item => item !== type)
        : [...prev, type]
    );
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy/MM/dd");
    } catch (err) {
      return dateString;
    }
  };
  
  const getCaseTitle = (session: Session) => {
    return session.cases?.title || "—";
  };
  
  const getCaseNumber = (session: Session) => {
    return session.cases?.case_number || "—";
  };
  
  const getClientName = (session: Session) => {
    if (!session.cases?.clients) return "—";
    
    const client = Array.isArray(session.cases.clients) 
      ? session.cases.clients[0] 
      : session.cases.clients;
    
    if (!client) return "—";
    
    const name = `${client.first_name} ${client.last_name}`;
    return client.company_name ? `${name} (${client.company_name})` : name;
  };
  
  const getSessionTypeDisplay = (type: string | null) => {
    if (!type) return "عادية";
    
    const types: Record<string, string> = {
      "first": "جلسة أولى",
      "regular": "عادية",
      "appeal": "استئناف",
      "final": "ختامية",
      "other": "أخرى",
      // Handle Arabic values
      "جلسة أولى": "جلسة أولى",
      "عادية": "عادية",
      "استئناف": "استئناف",
      "ختامية": "ختامية",
      "أخرى": "أخرى"
    };
    
    return types[type] || type;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">جلسات المحكمة</h1>
      </div>

      <div className="flex items-center gap-4">
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <SlidersHorizontal className="ml-2 h-4 w-4" />
              تصفية
              {getActiveFiltersCount() > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">تصفية الجلسات</h4>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs">
                  <X className="ml-1 h-3 w-3" /> إعادة ضبط
                </Button>
              </div>
              
              <div>
                <h5 className="mb-2 text-sm font-medium">نوع الجلسة</h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${sessionTypeFilter.includes('first') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleSessionTypeFilter('first')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${sessionTypeFilter.includes('first') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {sessionTypeFilter.includes('first') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      جلسة أولى
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${sessionTypeFilter.includes('regular') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleSessionTypeFilter('regular')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${sessionTypeFilter.includes('regular') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {sessionTypeFilter.includes('regular') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      عادية
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${sessionTypeFilter.includes('appeal') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleSessionTypeFilter('appeal')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${sessionTypeFilter.includes('appeal') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {sessionTypeFilter.includes('appeal') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      استئناف
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${sessionTypeFilter.includes('final') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleSessionTypeFilter('final')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${sessionTypeFilter.includes('final') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {sessionTypeFilter.includes('final') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      ختامية
                    </Button>
                  </div>
                  
                  {availableSessionTypes
                    .filter(type => !['first', 'regular', 'appeal', 'final', 'جلسة أولى', 'عادية', 'استئناف', 'ختامية'].includes(type))
                    .map(type => (
                      <div key={type} className="flex items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex justify-start h-8 ${sessionTypeFilter.includes(type) ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => toggleSessionTypeFilter(type)}
                        >
                          <div className={`ml-2 h-4 w-4 rounded-full border ${sessionTypeFilter.includes(type) ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                            {sessionTypeFilter.includes(type) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          {getSessionTypeDisplay(type)}
                        </Button>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                  {searchType === "all" && "الكل"}
                  {searchType === "case_title" && "عنوان القضية"}
                  {searchType === "case_number" && "رقم القضية"}
                  {searchType === "client" && "اسم العميل"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <DropdownMenuRadioItem value="all">الكل</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="case_title">عنوان القضية</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="case_number">رقم القضية</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="client">اسم العميل</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={
                  searchType === "all" ? "البحث في كل الحقول..." :
                  searchType === "case_title" ? "البحث عن عنوان القضية..." :
                  searchType === "case_number" ? "البحث عن رقم القضية..." :
                  "البحث عن اسم العميل..."
                }
                className="pl-10 text-right" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">بحث</Button>
            <Button 
              variant="outline" 
              size="icon" 
              type="button" 
              onClick={() => { 
                setSearchQuery(""); 
                fetchSessions(); 
              }}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">تحديث</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Active filters display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {sessionTypeFilter.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {getSessionTypeDisplay(type)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleSessionTypeFilter(type)}
              />
            </Badge>
          ))}
          {getActiveFiltersCount() > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={resetFilters}>
              مسح الكل
            </Button>
          )}
        </div>
      )}

      {error ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchSessions()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">القضية</TableHead>
                    <TableHead className="text-right">رقم القضية</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">تاريخ الجلسة</TableHead>
                    <TableHead className="text-right">المكان</TableHead>
                    <TableHead className="text-right">نوع الجلسة</TableHead>
                    <TableHead className="text-right w-[120px]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-9 w-[100px] rounded-md" /></TableCell>
                      </TableRow>
                    ))
                  ) : sessions.length > 0 ? (
                    sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">{getCaseTitle(session)}</TableCell>
                        <TableCell>{getCaseNumber(session)}</TableCell>
                        <TableCell>{getClientName(session)}</TableCell>
                        <TableCell>{formatDate(session.session_date)}</TableCell>
                        <TableCell>{session.location || "—"}</TableCell>
                        <TableCell>{getSessionTypeDisplay(session.session_type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/cases/${session.case_id}/sessions/${session.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">تعديل</span>
                              </Button>
                            </Link>
                            <Link href={`/cases/${session.case_id}`}>
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">عرض القضية</span>
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        لا توجد جلسات
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 