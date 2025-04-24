"use client"

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
import DashboardLayout from "./dashboard-layout"

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
      courtName: session.cases?.courts?.name
    };
  });
  
  // Navigation functions for calendar
  const previousWeek = () => {
    setCurrentWeekStart(prev => subDays(prev, 7));
  };
  
  const nextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return calendarEvents.filter(event => isSameDay(event.date, day));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي العملاء
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : clientCount}</div>
            <p className="text-xs text-muted-foreground">
              عميل
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              القضايا النشطة
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : activeCaseCount}</div>
            <p className="text-xs text-muted-foreground">
              قضية
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              جلسات اليوم
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : todaySessionsCount}</div>
            <p className="text-xs text-muted-foreground">
              جلسة
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              إجمالي الجلسات
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalSessionsCount}</div>
            <p className="text-xs text-muted-foreground">
              جلسة
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Simple week calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>جدول الأسبوع</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={previousWeek}>&larr;</Button>
            <Button variant="outline" size="sm" onClick={nextWeek}>&rarr;</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <WeekDayComponent 
                key={day.toString()} 
                day={day} 
                events={getEventsForDay(day)}
                isCurrentDay={isToday(day)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>آخر النشاطات</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActivitiesExpanded(!activitiesExpanded)}
            >
              {activitiesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isActivitiesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : recentActivities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد نشاطات حديثة</p>
            ) : (
              <div className="space-y-4">
                {displayedActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 rtl:space-x-reverse">
                    <div className="w-2 h-2 mt-1 rounded-full bg-primary"></div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                {!activitiesExpanded && recentActivities.length > 2 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setActivitiesExpanded(true)}
                  >
                    عرض المزيد
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Upcoming Sessions */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>الجلسات القادمة</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSessionsExpanded(!sessionsExpanded)}
            >
              {sessionsExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isSessionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد جلسات قادمة</p>
            ) : (
              <div className="space-y-4">
                {displayedSessions.map((session) => {
                  const sessionDate = parseISO(session.session_date);
                  return (
                    <div key={session.id} className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className="min-w-10 text-center">
                        <p className="text-sm font-medium">{format(sessionDate, 'd MMM', { locale: ar })}</p>
                        <p className="text-xs">{format(sessionDate, 'HH:mm')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{session.cases?.title || "جلسة"}</p>
                        <p className="text-xs text-muted-foreground">{session.cases?.courts?.name || "محكمة"}</p>
                      </div>
                    </div>
                  );
                })}
                {!sessionsExpanded && upcomingSessions.length > 2 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setSessionsExpanded(true)}
                  >
                    عرض المزيد
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  )
}
