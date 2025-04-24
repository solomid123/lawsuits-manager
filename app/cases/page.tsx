"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, SlidersHorizontal, MoreVertical, Trash2, X, Check, Filter } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteCase } from "@/app/actions/case-actions"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

type Case = {
  id: string
  title: string
  case_number: string
  status: string
  priority: string
  case_type: string
  client_id: string
  court_id: string
  created_at: string
  next_session_date?: string | null
  next_session_time?: string | null
  clients?: {
    first_name: string
    last_name: string
    company_name: string | null
  }
  courts?: {
    name: string
  }
  court_sessions?: Array<{
    session_date: string
    session_time: string | null
  }>
}

type CourtSession = {
  id: string;
  session_date: string;
  session_time: string | null;
  location: string | null;
  session_type: string | null;
};

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseCount, setActiveCaseCount] = useState(0);
  const [pendingCaseCount, setPendingCaseCount] = useState(0);
  const [weeklySessionsCount, setWeeklySessionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "title" | "case_number" | "client">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<{ id: string, title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [courtTypeFilter, setCourtTypeFilter] = useState<string[]>([]);
  const [availableCourtTypes, setAvailableCourtTypes] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const supabase = createClientComponentClient();
  
  const fetchCases = async (search = "") => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching cases with search:", search, "filters:", { status: statusFilter, courtType: courtTypeFilter });
      
      // First, get all cases with basic information
      let query = supabase
        .from("cases")
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company_name
          ),
          courts (
            name
          )
        `)
        .order("created_at", { ascending: false });
      
      // Apply search filters
      if (search) {
        if (searchType === "all") {
          // For "all" search, we need to handle client search separately
          // First, get client IDs matching the search
          const { data: clientsData } = await supabase
            .from("clients")
            .select("id")
            .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
          
          const clientIds = clientsData?.map(client => client.id) || [];
          
          if (clientIds.length > 0) {
            // If we found matching clients, search in cases with these clients or other fields
            query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%,client_id.in.(${clientIds.join(',')})`);
          } else {
            // If no matching clients, just search in other fields
            query = query.or(`title.ilike.%${search}%,case_number.ilike.%${search}%`);
          }
        } else if (searchType === "title") {
          query = query.ilike("title", `%${search}%`);
        } else if (searchType === "case_number") {
          query = query.ilike("case_number", `%${search}%`);
        } else if (searchType === "client") {
          // For client search, first find matching client IDs
          const { data: clientsData } = await supabase
            .from("clients")
            .select("id")
            .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`);
          
          const clientIds = clientsData?.map(client => client.id) || [];
          
          if (clientIds.length > 0) {
            // Use the in operator to filter cases with matching client IDs
            query = query.in("client_id", clientIds);
          } else {
            // If no matching clients, return empty set (add impossible condition)
            query = query.eq("id", "no-match-placeholder");
          }
        }
      }
      
      // Apply status filter
      if (statusFilter.length > 0) {
        query = query.in("status", statusFilter);
      }

      // Apply court type filter
      if (courtTypeFilter.length > 0) {
        query = query.in("case_type", courtTypeFilter);
      }
      
      const { data: casesData, error: casesError } = await query;
      
      if (casesError) {
        throw casesError;
      }
      
      console.log("Cases basic data fetched:", casesData?.length, "cases");

      // Extract all unique court types
      if (casesData) {
        const uniqueCourtTypes = Array.from(new Set(casesData.map(c => c.case_type))).filter(Boolean);
        setAvailableCourtTypes(uniqueCourtTypes);
      }
      
      // Now, get court sessions for all cases
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: allSessions, error: sessionsError } = await supabase
        .from("court_sessions")
        .select("*")
        .gte("session_date", today.toISOString())
        .order("session_date", { ascending: true });
        
      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
      }
      
      console.log("All future sessions fetched:", allSessions?.length || 0);
      
      // Group sessions by case ID
      const sessionsByCaseId: Record<string, CourtSession[]> = {};
      
      allSessions?.forEach(session => {
        if (!sessionsByCaseId[session.case_id]) {
          sessionsByCaseId[session.case_id] = [];
        }
        sessionsByCaseId[session.case_id].push(session);
      });
      
      // Process cases to ensure each has the next session date properly assigned
      const processedCases = casesData?.map(caseItem => {
        // Assign sessions to the case
        const caseSessions = sessionsByCaseId[caseItem.id] || [];
        caseItem.court_sessions = caseSessions;
        
        // Set next session date and time from the earliest session
        if (caseSessions.length > 0) {
          // Sessions are already sorted by date from the query
          const nextSession = caseSessions[0];
          caseItem.next_session_date = nextSession.session_date;
          caseItem.next_session_time = nextSession.session_time;
        }
        
        return caseItem;
      }) || [];
      
      setCases(processedCases);

      // Count active and pending cases
      if (casesData) {
        const active = casesData.filter(c => c.status === 'active').length;
        const pending = casesData.filter(c => c.status === 'pending').length;
        setActiveCaseCount(active);
        setPendingCaseCount(pending);
      }

      // Count sessions for this week
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const weekSessions = await supabase
        .from("court_sessions")
        .select("id", { count: "exact" })
        .gte("session_date", startOfWeek.toISOString())
        .lt("session_date", endOfWeek.toISOString());
      
      if (weekSessions.count !== null) {
        setWeeklySessionsCount(weekSessions.count);
      }
      
    } catch (err) {
      console.error("Error fetching cases:", err);
      setError("فشل في جلب القضايا. الرجاء المحاولة مرة أخرى لاحقاً.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCases();
  }, [statusFilter, courtTypeFilter]); // Re-fetch when filters change
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCases(searchQuery);
  };

  const resetFilters = () => {
    setStatusFilter([]);
    setCourtTypeFilter([]);
    setFilterOpen(false);
  };

  const getActiveFiltersCount = () => {
    return statusFilter.length + courtTypeFilter.length;
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(item => item !== status)
        : [...prev, status]
    );
  };

  const toggleCourtTypeFilter = (type: string) => {
    setCourtTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(item => item !== type)
        : [...prev, type]
    );
  };

  // Format client name
  const getClientName = (client: Case['clients']) => {
    if (!client) return "—";
    return client.company_name 
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;
  };

  // Format date consistently
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString;
    }
  };
  
  // Format session date and time
  function formatSessionDateTime(
    sessionDate: string | null,
    sessionTime: string | null | undefined
  ): string {
    if (!sessionDate) return "—";
    
    const formattedDate = formatDate(sessionDate);
    if (!sessionTime) return formattedDate;
    
    return `${formattedDate} - ${sessionTime}`;
  }
  
  // Get next session date (improved version)
  const getNextSessionDate = (sessions?: Array<{session_date: string, session_time: string | null}>) => {
    if (!sessions || sessions.length === 0) {
      return "—";
    }
    
    // Sessions are already filtered and sorted, just use the first one
    const nextSession = sessions[0];
    
    return formatSessionDateTime(nextSession.session_date, nextSession.session_time);
  };

  // Get court name
  const getCourtName = (court: Case['courts']) => {
    if (!court) return "—";
    return court.name;
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">نشط</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">معلق</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">مغلق</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Get case type display
  const getCaseTypeDisplay = (type: string) => {
    switch (type) {
      case 'civil': return 'مدني';
      case 'commercial': return 'تجاري';
      case 'criminal': return 'جنائي';
      case 'family': return 'أحوال شخصية';
      case 'administrative': return 'إداري';
      case 'labor': return 'عمالي';
      case 'other': return 'أخرى';
      // Also handle the Arabic text as input in case it comes from the database directly
      case 'مدني': return 'مدني';
      case 'تجاري': return 'تجاري';
      case 'جنائي': return 'جنائي';
      case 'أحوال شخصية': return 'أحوال شخصية';
      case 'إداري': return 'إداري';
      case 'عمالي': return 'عمالي';
      case 'أخرى': return 'أخرى';
      default: return type || '—';
    }
  };
  
  const handleDeleteClick = (caseItem: Case) => {
    setCaseToDelete({
      id: caseItem.id,
      title: caseItem.title
    });
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;
    
    try {
      const result = await deleteCase(caseToDelete.id);
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("تم حذف القضية بنجاح");
        // Refresh the case list
        fetchCases();
      }
    } catch (error) {
      console.error("Error deleting case:", error);
      toast.error("حدث خطأ أثناء حذف القضية");
    } finally {
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة القضايا</h1>
        <Link href="/cases/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            إضافة قضية جديدة
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">جلسات هذا الأسبوع</div>
            <div className="text-3xl font-bold text-green-600">
              {loading ? "..." : weeklySessionsCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">القضايا المعلقة</div>
            <div className="text-3xl font-bold text-amber-600">
              {loading ? "..." : pendingCaseCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-sm text-muted-foreground">القضايا النشطة</div>
            <div className="text-3xl font-bold text-blue-600">
              {loading ? "..." : activeCaseCount}
            </div>
          </CardContent>
        </Card>
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
                <h4 className="font-medium">تصفية القضايا</h4>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs">
                  <X className="ml-1 h-3 w-3" /> إعادة ضبط
                </Button>
              </div>
              
              <div>
                <h5 className="mb-2 text-sm font-medium">حالة القضية</h5>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${statusFilter.includes('active') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleStatusFilter('active')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${statusFilter.includes('active') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {statusFilter.includes('active') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      نشط
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${statusFilter.includes('pending') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleStatusFilter('pending')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${statusFilter.includes('pending') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {statusFilter.includes('pending') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      معلق
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex justify-start h-8 ${statusFilter.includes('closed') ? 'bg-primary/10 border-primary' : ''}`}
                      onClick={() => toggleStatusFilter('closed')}
                    >
                      <div className={`ml-2 h-4 w-4 rounded-full border ${statusFilter.includes('closed') ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                        {statusFilter.includes('closed') && <Check className="h-3 w-3 text-white" />}
                      </div>
                      مغلق
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="mb-2 text-sm font-medium">نوع القضية</h5>
                <div className="space-y-2">
                  {['civil', 'commercial', 'criminal', 'family', 'administrative', 'labor', ...availableCourtTypes]
                    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
                    .map(type => (
                      <div key={type} className="flex items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex justify-start h-8 ${courtTypeFilter.includes(type) ? 'bg-primary/10 border-primary' : ''}`}
                          onClick={() => toggleCourtTypeFilter(type)}
                        >
                          <div className={`ml-2 h-4 w-4 rounded-full border ${courtTypeFilter.includes(type) ? 'bg-primary border-primary' : 'border-muted-foreground'} flex items-center justify-center`}>
                            {courtTypeFilter.includes(type) && <Check className="h-3 w-3 text-white" />}
                          </div>
                          {getCaseTypeDisplay(type)}
                        </Button>
                      </div>
                    ))}
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
                  {searchType === "title" && "العنوان"}
                  {searchType === "case_number" && "رقم القضية"}
                  {searchType === "client" && "الموكل"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                  <DropdownMenuRadioItem value="all">الكل</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">العنوان</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="case_number">رقم القضية</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="client">الموكل</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={
                  searchType === "all" ? "البحث في كل الحقول..." :
                  searchType === "title" ? "البحث عن عنوان القضية..." :
                  searchType === "case_number" ? "البحث عن رقم القضية..." :
                  "البحث عن اسم الموكل..."
                }
                className="pl-10 text-right" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm">بحث</Button>
          </form>
        </div>
      </div>

      {/* Active filters display */}
      {getActiveFiltersCount() > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusFilter.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              {status === 'active' ? 'نشط' : status === 'pending' ? 'معلق' : 'مغلق'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleStatusFilter(status)}
              />
            </Badge>
          ))}
          {courtTypeFilter.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {getCaseTypeDisplay(type)}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => toggleCourtTypeFilter(type)}
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
          <Button variant="outline" size="sm" onClick={() => fetchCases()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-right text-sm font-medium">رقم القضية</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">العنوان</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">المحكمة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الموكل</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">النوع</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الجلسة القادمة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(3).fill(0).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-4 py-3 text-sm"><Skeleton className="h-8 w-8 rounded-full" /></td>
                    </tr>
                  ))
                ) : cases.length > 0 ? (
                  cases.map((caseItem) => (
                    <tr key={caseItem.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{caseItem.case_number}</td>
                      <td className="px-4 py-3 text-sm">{caseItem.title}</td>
                      <td className="px-4 py-3 text-sm">{getCourtName(caseItem.courts)}</td>
                      <td className="px-4 py-3 text-sm">{getClientName(caseItem.clients)}</td>
                      <td className="px-4 py-3 text-sm">{getCaseTypeDisplay(caseItem.case_type)}</td>
                      <td className="px-4 py-3 text-sm">
                        {caseItem.court_sessions && caseItem.court_sessions.length > 0 
                          ? (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {getNextSessionDate(caseItem.court_sessions)}
                              </span>
                            )
                          : caseItem.next_session_date
                            ? (
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                  {formatSessionDateTime(caseItem.next_session_date, caseItem.next_session_time || null)}
                                </span>
                              )
                            : "—"
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getStatusDisplay(caseItem.status)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">فتح القائمة</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/cases/${caseItem.id}`}>
                                عرض التفاصيل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/cases/${caseItem.id}/edit`}>
                                تعديل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/cases/${caseItem.id}/sessions/new`}>
                                إضافة جلسة
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(caseItem)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              حذف القضية
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      لا توجد قضايا. انقر على "إضافة قضية جديدة" لإضافة أول قضية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف القضية</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف القضية "{caseToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
