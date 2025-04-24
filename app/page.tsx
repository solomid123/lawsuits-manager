"use client"

import DashboardLayout from "./dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Calendar, Users, ChevronDown, ChevronUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"
import useSWR from "swr"
import {
  fetchClientCount,
  fetchActiveCaseCount,
  fetchTodaySessionsCount,
  fetchTotalSessionsCount,
  fetchRecentActivities,
  fetchUpcomingSessions
} from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { format, addDays, subDays, isToday, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"
import { ar } from "date-fns/locale"

// Define types for our data
type Session = {
  id: string;
  session_date: string;
  cases?: {
    title?: string;
    courts?: {
      name?: string;
    };
  };
};

type Activity = {
  id: string;
  description: string;
  created_at: string;
  entity_type: string | null;
};

// Calendar event type
type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: string;
  caseTitle?: string;
  courtName?: string;
};

// Custom day component to display events in calendar
const WeekDayComponent = ({ day, events, isCurrentDay }: { day: Date, events: CalendarEvent[], isCurrentDay: boolean }) => {
  const dayName = format(day, 'EEEE', { locale: ar });
  const dayNumber = format(day, 'd');
  
  return (
    <div className={`p-2 border rounded-md ${isCurrentDay ? 'bg-primary/10 border-primary' : 'bg-background'}`}>
      <div className="text-center mb-2">
        <div className="text-sm font-medium">{dayName}</div>
        <div className={`text-lg font-bold ${isCurrentDay ? 'text-primary' : ''}`}>{dayNumber}</div>
      </div>
      <div className="space-y-1 max-h-[150px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-2">لا توجد أحداث</div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id} 
              className={`text-xs p-1.5 rounded-sm ${
                event.type === 'session' ? 'bg-blue-100 text-blue-700' :
                event.type === 'case' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}
            >
              <div className="font-medium truncate" title={event.title}>{event.title}</div>
              {event.time && <div className="text-[10px]">{event.time}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function Dashboard() {
  // State for expand/collapse
  const [activitiesExpanded, setActivitiesExpanded] = useState(false);
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 0 }));

  // Add debug effect
  useEffect(() => {
    // Debug the upcoming sessions directly
    fetchUpcomingSessions().then(data => {
      console.log('Direct fetch of upcoming sessions data:', data);
      // Check the shape of the data
      if (data && data.length > 0) {
        console.log('First session:', data[0]);
        console.log('Cases property type:', data[0].cases ? (Array.isArray(data[0].cases) ? 'array' : 'object') : 'undefined');
        if (data[0].cases) {
          if (Array.isArray(data[0].cases) && data[0].cases.length > 0) {
            console.log('First case in array:', data[0].cases[0]);
            console.log('Courts property in first case:', data[0].cases[0].courts);
          } else if (typeof data[0].cases === 'object') {
            console.log('Case object:', data[0].cases);
            console.log('Courts property in case object:', (data[0].cases as any).courts);
          }
        }
      }
    }).catch(err => {
      console.error('Error fetching upcoming sessions directly:', err);
    });
  }, []);

  // Use SWR hooks for data fetching with fallback values
  const { data: clientCount = 0, isLoading: isClientLoading } = useSWR<number>('clientCount', fetchClientCount)
  const { data: activeCaseCount = 0, isLoading: isCaseLoading } = useSWR<number>('activeCaseCount', fetchActiveCaseCount)
  const { data: todaySessionsCount = 0, isLoading: isTodaySessionsLoading } = useSWR<number>('todaySessionsCount', fetchTodaySessionsCount)
  const { data: totalSessionsCount = 0, isLoading: isTotalSessionsLoading } = useSWR<number>('totalSessionsCount', fetchTotalSessionsCount)
  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useSWR<Activity[]>('recentActivities', fetchRecentActivities)
  const { data: upcomingSessions = [], isLoading: isSessionsLoading } = useSWR<Session[]>('upcomingSessions', () => 
    fetchUpcomingSessions().then(data => {
      console.log('Raw upcoming sessions data:', data);
      
      // Use a simpler transformation approach
      return data.map(session => {
        // Extract data with clear fallbacks
        let caseTitle = "قضية غير معروفة";
        let courtName = "محكمة غير معروفة";
        
        try {
          // Handle various possible data structures
          if (session.cases) {
            // Handle array of cases
            if (Array.isArray(session.cases) && session.cases.length > 0) {
              if ((session.cases[0] as any).title) {
                caseTitle = (session.cases[0] as any).title;
              }
              
              if ((session.cases[0] as any).courts) {
                if (Array.isArray((session.cases[0] as any).courts) && (session.cases[0] as any).courts.length > 0) {
                  courtName = ((session.cases[0] as any).courts[0] as any).name || courtName;
                } else {
                  courtName = ((session.cases[0] as any).courts as any).name || courtName;
                }
              }
            } 
            // Handle direct case object
            else {
              caseTitle = (session.cases as any).title || caseTitle;
              
              if ((session.cases as any).courts) {
                if (Array.isArray((session.cases as any).courts) && (session.cases as any).courts.length > 0) {
                  courtName = ((session.cases as any).courts[0] as any).name || courtName;
                } else {
                  courtName = ((session.cases as any).courts as any).name || courtName;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error transforming session data:', error, session);
        }
        
        // Always return a valid structure regardless of input
        return {
          id: session.id,
          session_date: session.session_date,
          cases: {
            title: caseTitle,
            courts: {
              name: courtName
            }
          }
        };
      });
    })
  )

  // Combined loading state
  const isLoading = isClientLoading || isCaseLoading || isTodaySessionsLoading || isTotalSessionsLoading;

  // Get the activities to display (limited or all)
  const displayedActivities = activitiesExpanded 
    ? recentActivities 
    : recentActivities.slice(0, 2);

  // Get the sessions to display (limited or all)
  const displayedSessions = sessionsExpanded 
    ? upcomingSessions 
    : upcomingSessions.slice(0, 2);
    
  // Generate week days array for calendar display
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  
  // Convert upcoming sessions to calendar events
  const calendarEvents: CalendarEvent[] = upcomingSessions.map(session => {
    const sessionDate = session.session_date ? parseISO(session.session_date) : new Date();
    return {
      id: session.id,
      title: session.cases?.title || "جلسة",
      date: sessionDate,
      time: format(sessionDate, 'HH:mm'),
      type: 'session',
      caseTitle: session.cases?.title,
      courtName: session.cases?.courts?.name
    };
  });
  
  // Handle week navigation
  const previousWeek = () => {
    setCurrentWeekStart(prevStart => subDays(prevStart, 7));
  };
  
  const nextWeek = () => {
    setCurrentWeekStart(prevStart => addDays(prevStart, 7));
  };
  
  // Helper function to get events for a specific day
  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, day));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">لوحة التحكم</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الجلسات</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : totalSessionsCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">العملاء</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : clientCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">جلسات اليوم</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : todaySessionsCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-row items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">القضايا النشطة</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : activeCaseCount}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>جلسات الأسبوع</CardTitle>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" size="sm" onClick={previousWeek}>
                الأسبوع السابق
              </Button>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                الأسبوع القادم
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 overflow-auto">
            {weekDays.map((day) => (
              <WeekDayComponent
                key={day.toISOString()}
                day={day}
                events={getEventsForDay(day)}
                isCurrentDay={isToday(day)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">آخر النشاطات</CardTitle>
            {recentActivities.length > 2 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActivitiesExpanded(!activitiesExpanded)}
                className="h-8 w-8 p-0"
              >
                {activitiesExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isActivitiesLoading ? (
              <p className="text-center text-muted-foreground">جاري التحميل...</p>
            ) : displayedActivities.length > 0 ? (
              displayedActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true
                    })}
                  </div>
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">{activity.entity_type}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">لا توجد نشاطات حديثة</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row justify-between items-center">
            <CardTitle className="text-lg">الجلسات القادمة</CardTitle>
            {upcomingSessions.length > 2 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSessionsExpanded(!sessionsExpanded)}
                className="h-8 w-8 p-0"
              >
                {sessionsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isSessionsLoading ? (
              <p className="text-center text-muted-foreground">جاري التحميل...</p>
            ) : displayedSessions.length > 0 ? (
              displayedSessions.map((session) => {
                // Parse the date, handling possible date format issues
                const sessionDate = new Date(session.session_date);
                return (
                  <div key={session.id} className="flex items-start gap-4">
                    <div className="text-xs text-muted-foreground">
                      {format(sessionDate, 'dd/MM/yyyy')}
                    </div>
                    <div>
                      <p className="font-medium">{session.cases?.title}</p>
                      <p className="text-sm text-muted-foreground">{session.cases?.courts?.name}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground">لا توجد جلسات قادمة</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RootPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  )
}
