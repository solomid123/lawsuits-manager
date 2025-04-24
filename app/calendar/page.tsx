"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, Calendar as CalendarIcon2, X, Loader2 } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { ar } from "date-fns/locale"
import { CalendarEvent } from "@/lib/google-calendar"
import AddEventDialog from "./add-event-dialog"
import { db } from "@/lib/db" // Import your database connection

// API functions for fetching real data
async function fetchSessionsFromDatabase(start: Date, end: Date): Promise<any[]> {
  try {
    // Convert dates to ISO strings for database query
    const startStr = start.toISOString();
    const endStr = end.toISOString();
    
    // Fetch court sessions from your database
    const sessions = await db.courtSession.findMany({
      where: {
        date: {
          gte: startStr,
          lte: endStr
        }
      }
    });
    
    return sessions;
  } catch (error) {
    console.error("Error fetching court sessions:", error);
    return [];
  }
}

async function fetchCaseEventsFromDatabase(start: Date, end: Date): Promise<any[]> {
  try {
    // Convert dates to ISO strings for database query
    const startStr = start.toISOString();
    const endStr = end.toISOString();
    
    // Fetch case events from your database
    const caseEvents = await db.caseEvent.findMany({
      where: {
        date: {
          gte: startStr,
          lte: endStr
        }
      }
    });
    
    return caseEvents;
  } catch (error) {
    console.error("Error fetching case events:", error);
    return [];
  }
}

// Convert database records to CalendarEvent format
function convertSessionToCalendarEvent(session: any): CalendarEvent {
  // Extract date from session_date (which is a timestamptz)
  const sessionDate = session.session_date ? new Date(session.session_date) : new Date();
  
  // If session_time is provided, use it to set the hours and minutes
  if (session.session_time) {
    const [hours, minutes] = session.session_time.split(':').map(Number);
    sessionDate.setHours(hours || 0, minutes || 0, 0, 0);
  }
  
  // Default duration to 60 minutes for end time
  const endDate = new Date(sessionDate);
  endDate.setMinutes(endDate.getMinutes() + 60);
  
  // Get case title from the nested case object
  const caseTitle = session.cases?.title || 'غير محدد';
  
  // Build the title with additional information if available
  let title = session.title || `جلسة - ${caseTitle}`;
  if (session.session_type) {
    title = `${title} (${session.session_type})`;
  }
  
  return {
    id: `session-${session.id}`,
    title: title,
    start: sessionDate,
    end: endDate,
    type: "session",
    caseId: session.case_id?.toString(),
    caseName: caseTitle,
    location: session.location,
    description: session.notes
  };
}

function convertCaseEventToCalendarEvent(event: any): CalendarEvent {
  // Determine the event type based on the event_type field and is_milestone flag
  let eventType = "other";
  if (event.is_milestone) eventType = "milestone";
  else if (event.event_type === "task") eventType = "task";
  else if (event.is_decision) eventType = "decision";
  else if (event.event_type) eventType = event.event_type;
  
  // Extract date from event_date
  const eventDate = event.event_date ? new Date(event.event_date) : new Date();
  
  // For end time, default to 1 hour after start time
  const endDate = new Date(eventDate);
  endDate.setMinutes(endDate.getMinutes() + 60);
  
  return {
    id: `event-${event.id}`,
    title: event.title || `حدث - ${event.cases?.title || 'غير محدد'}`,
    start: eventDate,
    end: endDate,
    type: eventType,
    caseId: event.case_id?.toString(),
    caseName: event.cases?.title,
    description: event.description
  };
}

// Mock events function - this would be replaced with your API call
function getMockEvents(): CalendarEvent[] {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  return [
    {
      id: "1",
      title: "جلسة قضية الشركة ضد المورد",
      start: new Date(currentYear, currentMonth, 15, 10, 0),
      end: new Date(currentYear, currentMonth, 15, 11, 30),
      type: "session",
      caseId: "case123",
      caseName: "الشركة ضد المورد",
      location: "المحكمة التجارية - الرياض"
    },
    {
      id: "2",
      title: "تسليم المستندات للمحكمة",
      start: new Date(currentYear, currentMonth, 20, 9, 0),
      end: new Date(currentYear, currentMonth, 20, 9, 30),
      type: "milestone",
      caseId: "case123",
      caseName: "الشركة ضد المورد"
    },
    {
      id: "3",
      title: "اجتماع مع العميل لمناقشة التسوية",
      start: new Date(currentYear, currentMonth, 18, 14, 0),
      end: new Date(currentYear, currentMonth, 18, 15, 0),
      type: "task",
      caseId: "case456",
      caseName: "قضية عبدالله النوفلي"
    },
    {
      id: "4",
      title: "جلسة قضية النوفلي",
      start: new Date(currentYear, currentMonth, 25, 11, 0),
      end: new Date(currentYear, currentMonth, 25, 12, 30),
      type: "session",
      caseId: "case456",
      caseName: "قضية عبدالله النوفلي",
      location: "المحكمة الإدارية - الرياض"
    },
    {
      id: "5",
      title: "موعد تسليم المذكرة",
      start: new Date(currentYear, currentMonth, 28, 9, 0),
      end: new Date(currentYear, currentMonth, 28, 10, 0),
      type: "milestone",
      caseId: "case789",
      caseName: "شركة الأمل ضد المقاول"
    }
  ];
}

// Custom day component to display events in calendar
const CalendarDay = ({ day, events }: { day: Date, events: CalendarEvent[] }) => {
  const eventsOnDay = events.filter(event => 
    isSameDay(event.start, day)
  );
  
  if (eventsOnDay.length === 0) {
    return <div className="h-full min-h-[80px]">{day.getDate()}</div>;
  }
  
  return (
    <div className="h-full min-h-[80px] flex flex-col">
      <div className="text-sm font-semibold mb-1">{day.getDate()}</div>
      <div className="flex-1 overflow-y-auto">
        {eventsOnDay.map((event, index) => (
          <div 
            key={event.id} 
            className={`text-xs p-1 mb-1 rounded truncate ${
              event.type === 'session' ? 'bg-blue-100 text-blue-700' :
              event.type === 'milestone' ? 'bg-green-100 text-green-700' :
              event.type === 'task' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}
            title={event.title}
          >
            {format(event.start, 'HH:mm')} - {event.title}
          </div>
        ))}
      </div>
    </div>
  );
};

// Function to create a new mock event
function createMockEvent(event: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: `event-${Date.now()}`,
    title: event.title || 'Untitled Event',
    start: event.start || new Date(),
    end: event.end || new Date(Date.now() + 3600000), // 1 hour later
    type: event.type || 'other',
    description: event.description,
    location: event.location,
    caseId: event.caseId,
    caseName: event.caseName
  };
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventType, setEventType] = useState<string>("all")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  
  // Fetch events for the given month
  const fetchEventsForMonth = async (date: Date) => {
    setLoading(true)
    try {
      // Get the start and end of the month
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      
      // Fetch data from the database
      const sessions = await fetchSessionsFromDatabase(start, end);
      const caseEvents = await fetchCaseEventsFromDatabase(start, end);
      
      // Convert database records to CalendarEvent format
      const sessionEvents = sessions.map(convertSessionToCalendarEvent);
      const caseCalendarEvents = caseEvents.map(convertCaseEventToCalendarEvent);
      
      // Combine all events
      const allEvents = [...sessionEvents, ...caseCalendarEvents];
      
      // Use the fetched events if available, otherwise fall back to mock data
      const fetchedEvents = allEvents.length > 0 ? allEvents : getMockEvents();
      setEvents(fetchedEvents);
      
      // Log the fetched events for debugging
      console.log('Fetched events:', fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("فشل في جلب الأحداث من قاعدة البيانات");
      
      // Fall back to mock data on error
      setEvents(getMockEvents());
    } finally {
      setLoading(false);
    }
  }
  
  // Load events when component mounts
  useEffect(() => {
    fetchEventsForMonth(selectedDate || new Date())
  }, [])
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    const newDate = subMonths(viewDate, 1)
    setViewDate(newDate)
    fetchEventsForMonth(newDate)
  }
  
  const handleNextMonth = () => {
    const newDate = addMonths(viewDate, 1)
    setViewDate(newDate)
    fetchEventsForMonth(newDate)
  }
  
  // Handle adding a new event
  const handleAddEvent = () => {
    setIsAddEventDialogOpen(true)
  }
  
  // Handle event added
  const handleEventAdded = (event: CalendarEvent) => {
    // Add the new event to the events list
    setEvents(prev => [...prev, event])
  }
  
  // Filter events based on selected type
  const filteredEvents = eventType === "all" 
    ? events 
    : events.filter(event => event.type === eventType)
  
  // Get events for the selected date
  const eventsForSelectedDate = selectedDate 
    ? filteredEvents.filter(event => 
        event.start.getDate() === selectedDate.getDate() &&
        event.start.getMonth() === selectedDate.getMonth() &&
        event.start.getFullYear() === selectedDate.getFullYear()
      ) 
    : []
  
  // Handle creating a new event
  const handleCreateEvent = async (event: CalendarEvent) => {
    try {
      setLoading(true)
      
      // Here you would call your API to create the event
      // For now, we'll just create a mock event
      const createdEvent = createMockEvent(event)
      
      if (createdEvent) {
        toast.success('تم إنشاء الحدث بنجاح', {
          position: 'top-center'
        })
        
        // Add the new event to the list
        setEvents(prev => [...prev, createdEvent])
      } else {
        toast.error('فشل إنشاء الحدث')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('حدث خطأ أثناء إنشاء الحدث')
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch events when date changes
  useEffect(() => {
    fetchEventsForMonth(selectedDate || new Date())
  }, [selectedDate])
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">التقويم</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto bg-red-50 text-red-500 rounded-md focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-800 font-medium">Loading...</p>
          </div>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Calendar View */}
        <Card className="md:col-span-1 lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>عرض التقويم</CardTitle>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="نوع الحدث" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأحداث</SelectItem>
                  <SelectItem value="session">جلسات</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  الشهر السابق
                </Button>
                <h3 className="text-lg font-medium">{format(viewDate, 'MMMM yyyy', { locale: ar })}</h3>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  الشهر التالي
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <div className="custom-calendar">
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center font-semibold">
                    {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
                      <div key={day} className="p-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const today = new Date();
                      const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
                      const lastDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
                      
                      const daysArray = [];
                      // Get the number of days from previous month to show
                      const startDay = firstDayOfMonth.getDay();
                      // Previous month days
                      for (let i = 0; i < startDay; i++) {
                        const previousMonthDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), -startDay + i + 1);
                        daysArray.push(
                          <div key={`prev-${i}`} className="border p-1 min-h-[100px] bg-gray-50 text-gray-400">
                            <CalendarDay day={previousMonthDay} events={[]} />
                          </div>
                        );
                      }
                      
                      // Current month days
                      for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
                        const isToday = isSameDay(date, today);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        
                        daysArray.push(
                          <div 
                            key={`current-${i}`} 
                            className={`border p-1 min-h-[100px] cursor-pointer
                              ${isToday ? 'bg-blue-50' : 'bg-white'}
                              ${isSelected ? 'ring-2 ring-primary' : ''}
                            `}
                            onClick={() => setSelectedDate(date)}
                          >
                            <CalendarDay day={date} events={filteredEvents} />
                          </div>
                        );
                      }
                      
                      // Next month days to complete the grid
                      const remainingCells = 42 - daysArray.length; // 6 rows x 7 days
                      for (let i = 1; i <= remainingCells; i++) {
                        const nextMonthDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, i);
                        daysArray.push(
                          <div key={`next-${i}`} className="border p-1 min-h-[100px] bg-gray-50 text-gray-400">
                            <CalendarDay day={nextMonthDay} events={[]} />
                          </div>
                        );
                      }
                      
                      return daysArray;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Event List */}
        <Card className="md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>
              الأحداث {selectedDate && `- ${format(selectedDate, 'dd/MM/yyyy')}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon2 className="h-12 w-12 mx-auto opacity-20 mb-2" />
                <p>لا توجد أحداث في هذا اليوم</p>
              </div>
            ) : (
              <div className="space-y-4">
                {eventsForSelectedDate.map(event => (
                  <div key={event.id} className="border rounded-md p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        event.type === 'session' ? 'bg-blue-100 text-blue-700' :
                        event.type === 'milestone' ? 'bg-green-100 text-green-700' :
                        event.type === 'task' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {event.type === 'session' ? 'جلسة' :
                         event.type === 'milestone' ? 'مرحلة' :
                         event.type === 'task' ? 'مهمة' : 'أخرى'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                    </p>
                    {event.caseName && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">القضية:</span> {event.caseName}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">المكان:</span> {event.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Add event dialog - keeping this for potential future use */}
      <AddEventDialog
        open={isAddEventDialogOpen}
        onOpenChange={setIsAddEventDialogOpen}
        onEventAdded={handleEventAdded}
        accessToken="mock-token"
      />
    </div>
  )
} 