"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { CalendarIcon, X } from "lucide-react"
import { CalendarEvent } from "@/lib/google-calendar"
import { format } from "date-fns"
import { toast } from "sonner"
import { supabaseClient } from "@/lib/supabase-client"

interface Case {
  id: string
  title: string
}

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventAdded: (event: CalendarEvent) => void
  accessToken: string | null
}

export default function AddEventDialog({ 
  open, 
  onOpenChange, 
  onEventAdded,
  accessToken
}: AddEventDialogProps) {
  const [title, setTitle] = useState("")
  const [eventType, setEventType] = useState<string>("other")
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("10:00")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [selectedCaseId, setSelectedCaseId] = useState<string>("")
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch cases from database
  useEffect(() => {
    async function fetchCases() {
      try {
        const { data, error } = await supabaseClient
          .from('cases')
          .select('id, title')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedCases = data.map(c => ({
            id: c.id.toString(),
            title: c.title
          }));
          setCases(formattedCases);
        } else {
          // Fallback to mock data if no cases found
          const mockCases: Case[] = [
            { id: "case123", title: "الشركة ضد المورد" },
            { id: "case456", title: "قضية عبدالله النوفلي" },
            { id: "case789", title: "شركة الأمل ضد المقاول" }
          ];
          setCases(mockCases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
        // Fallback to mock data on error
        const mockCases: Case[] = [
          { id: "case123", title: "الشركة ضد المورد" },
          { id: "case456", title: "قضية عبدالله النوفلي" },
          { id: "case789", title: "شركة الأمل ضد المقاول" }
        ];
        setCases(mockCases);
      }
    }
    
    fetchCases();
  }, []);
  
  // Save event to database
  const saveEventToDatabase = async (eventData: {
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    event_type: string;
    case_id?: string;
    location?: string;
    description?: string;
  }) => {
    try {
      // For court sessions
      if (eventData.event_type === 'session') {
        // Create a combined date and time for session_date
        const dateObj = new Date(eventData.date);
        const [hours, minutes] = eventData.start_time.split(':').map(Number);
        dateObj.setHours(hours || 0, minutes || 0, 0, 0);
        
        const { data, error } = await supabaseClient
          .from('court_sessions')
          .insert({
            session_date: dateObj.toISOString(), // Store as timestamptz
            session_time: eventData.start_time, // Store time separately as string
            notes: eventData.description,
            location: eventData.location,
            case_id: eventData.case_id || null,
            session_type: 'regular' // Default session type
          })
          .select();
        
        if (error) throw error;
        return data?.[0];
      } 
      // For other event types (milestones, tasks)
      else {
        // Create a combined date and time
        const dateObj = new Date(eventData.date);
        const [hours, minutes] = eventData.start_time.split(':').map(Number);
        dateObj.setHours(hours || 0, minutes || 0, 0, 0);
        
        const { data, error } = await supabaseClient
          .from('case_events')
          .insert({
            event_date: dateObj.toISOString(),
            title: eventData.title,
            description: eventData.description,
            event_type: eventData.event_type,
            case_id: eventData.case_id || null,
            is_milestone: eventData.event_type === 'milestone',
            is_decision: eventData.event_type === 'decision'
          })
          .select();
        
        if (error) throw error;
        return data?.[0];
      }
    } catch (error) {
      console.error("Error saving event to database:", error);
      throw error;
    }
  };
  
  // Calculate duration in minutes between start and end time
  const calculateDurationInMinutes = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    return endMinutes - startMinutes;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title) {
      toast.error("الرجاء إدخال عنوان الحدث")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Create date string in ISO format
      const [year, month, day] = date.split("-").map(Number);
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Save event to database
      await saveEventToDatabase({
        title,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        event_type: eventType,
        case_id: selectedCaseId || undefined,
        location,
        description
      });
      
      // Create calendar event object for UI
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      
      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      const endDate = new Date(year, month - 1, day, endHour, endMinute);
      
      // Find selected case name
      const selectedCase = cases.find(c => c.id === selectedCaseId);
      
      // Create event object
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title,
        start: startDate,
        end: endDate,
        type: eventType,
        description,
        location,
        caseId: selectedCaseId,
        caseName: selectedCase?.title
      };

      toast.success("تم إضافة الحدث بنجاح");
      onEventAdded(newEvent);
      
      // Reset form
      setTitle("");
      setEventType("other");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setStartTime("09:00");
      setEndTime("10:00");
      setDescription("");
      setLocation("");
      setSelectedCaseId("");
      
      // Close dialog
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("حدث خطأ أثناء إنشاء الحدث");
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">إضافة حدث جديد</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الحدث*</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="أدخل عنوان الحدث" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">نوع الحدث</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="اختر نوع الحدث" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">جلسة</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">التاريخ*</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="start-time">وقت البدء*</Label>
                <Input 
                  id="start-time" 
                  type="time" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">وقت الانتهاء*</Label>
                <Input 
                  id="end-time" 
                  type="time" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required 
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">المكان</Label>
            <Input 
              id="location" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)} 
              placeholder="أدخل مكان الحدث" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="case">القضية المرتبطة</Label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القضية المرتبطة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون قضية</SelectItem>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="أدخل وصف الحدث" 
              rows={3}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></span>
                  جاري الإضافة...
                </>
              ) : "إضافة الحدث"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 