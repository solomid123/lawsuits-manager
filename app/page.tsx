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
  fetchUpcomingSessions,
  fetchCalendarSessions
} from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { format, addDays, subDays, isToday, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns"
import { ar } from "date-fns/locale"
import DashboardLayout from "./dashboard-layout"
import { supabaseClient } from "@/lib/supabase-client"

// Define types for our data
type Session = {
  id: string;
  session_date: string;
  session_time?: string;
  case_id?: string;
  cases: {
    id?: string;
    title?: string;
    court_id?: string;
    client_id?: string;
    courts?: {
      id?: string;
      name?: string;
    };
    clients?: {
      id?: string;
      name?: string;
      company_name?: string;
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
  
  // Calculate week end date for calendar query
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

  // Use SWR hooks for data fetching with fallback values
  const { data: clientCount = 0, isLoading: isClientLoading } = useSWR<number>('clientCount', fetchClientCount)
  const { data: activeCaseCount = 0, isLoading: isCaseLoading } = useSWR<number>('activeCaseCount', fetchActiveCaseCount)
  const { data: todaySessionsCount = 0, isLoading: isTodaySessionsLoading } = useSWR<number>('todaySessionsCount', fetchTodaySessionsCount)
  const { data: totalSessionsCount = 0, isLoading: isTotalSessionsLoading } = useSWR<number>('totalSessionsCount', fetchTotalSessionsCount)
  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useSWR<Activity[]>('recentActivities', fetchRecentActivities)

  // Update the SWR fetcher function for upcoming sessions (future only)
  const sessionFetcher = async (): Promise<Session[]> => {
    try {
      // Get sessions with joined data
      const sessionsData = await fetchUpcomingSessions();
      console.log('Raw upcoming sessions data with relations:', sessionsData);
      
      // Transform the sessions data with correct path to client info
      return sessionsData.map(rawSession => {
        // Cast to any to avoid TypeScript errors
        const raw = rawSession as any;
        
        // Extract case title from the case relationship
        let caseTitle = "جلسة";
        if (raw.cases && raw.cases.title) {
          caseTitle = raw.cases.title;
        }
        
        // Extract client name with proper path based on schema
        let clientName = "عميل";
        if (raw.cases && raw.cases.clients) {
          const client = raw.cases.clients;
          if (client.company_name) {
            // Use company name for companies
            clientName = client.company_name;
          } else if (client.first_name || client.last_name) {
            // Combine first and last name for individuals
            clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
          }
        }
        
        // Create a session object
        return {
          id: raw.id || '',
          session_date: raw.session_date || '',
          session_time: raw.session_time || '',
          case_id: raw.case_id || '',
          cases: {
            title: caseTitle,
            courts: { name: "محكمة" },
            clients: { name: clientName }
          }
        };
      });
    } catch (error) {
      console.error('Error in sessionFetcher:', error);
      return [];
    }
  };

  // Calendar sessions fetcher (all sessions in date range, not just future)
  const calendarSessionsFetcher = async (): Promise<Session[]> => {
    try {
      // Get calendar sessions with date range
      const sessionsData = await fetchCalendarSessions(currentWeekStart, currentWeekEnd);
      console.log('Raw calendar sessions data with relations:', sessionsData);
      
      // Transform the sessions data with correct path to client info (same as above)
      return sessionsData.map(rawSession => {
        // Cast to any to avoid TypeScript errors
        const raw = rawSession as any;
        
        // Extract case title from the case relationship
        let caseTitle = "جلسة";
        if (raw.cases && raw.cases.title) {
          caseTitle = raw.cases.title;
        }
        
        // Extract client name with proper path based on schema
        let clientName = "عميل";
        if (raw.cases && raw.cases.clients) {
          const client = raw.cases.clients;
          if (client.company_name) {
            // Use company name for companies
            clientName = client.company_name;
          } else if (client.first_name || client.last_name) {
            // Combine first and last name for individuals
            clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
          }
        }
        
        // Create a session object
        return {
          id: raw.id || '',
          session_date: raw.session_date || '',
          session_time: raw.session_time || '',
          case_id: raw.case_id || '',
          cases: {
            title: caseTitle,
            courts: { name: "محكمة" },
            clients: { name: clientName }
          }
        };
      });
    } catch (error) {
      console.error('Error in calendarSessionsFetcher:', error);
      return [];
    }
  };

  // Then use these in the SWR hooks
  const { data: upcomingSessions = [], isLoading: isSessionsLoading } = useSWR<Session[]>('upcomingSessions', sessionFetcher)
  const { data: calendarSessions = [], isLoading: isCalendarSessionsLoading } = useSWR<Session[]>(
    ['calendarSessions', currentWeekStart.toISOString(), currentWeekEnd.toISOString()], 
    calendarSessionsFetcher
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
  
  // Convert calendar sessions to calendar events
  const calendarEvents: CalendarEvent[] = calendarSessions.map(session => {
    const sessionDate = session.session_date ? parseISO(session.session_date) : new Date();
    
    // Handle session time properly
    let displayTime = "00:00";
    
    if (session.session_time) {
      displayTime = session.session_time;
    } else {
      // Fallback to extracting time from sessionDate
      displayTime = format(sessionDate, 'HH:mm');
    }
    
    return {
      id: session.id,
      title: session.cases?.title || "جلسة",
      date: sessionDate,
      time: displayTime,
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
    const checkDate = format(day, 'yyyy-MM-dd');
    console.log(`Checking events for day: ${checkDate}, Total events: ${calendarEvents.length}`);
    
    // Simple date string comparison to avoid timezone issues
    const filteredEvents = calendarEvents.filter(event => {
      const eventDate = format(event.date, 'yyyy-MM-dd');
      const matches = eventDate === checkDate;
      if (matches) {
        console.log(`Found event for ${checkDate}: ${event.title}`);
      }
      return matches;
    });
    
    console.log(`Found ${filteredEvents.length} events for ${checkDate}`);
    return filteredEvents;
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
                  const caseTitle = session.cases?.title || "جلسة";
                  const courtName = session.cases?.courts?.name || "محكمة";
                  const clientName = session.cases?.clients?.name || "عميل غير معروف";
                  
                  return (
                    <div key={session.id} className="flex items-start space-x-4 rtl:space-x-reverse">
                      <div className="min-w-10 text-center">
                        <p className="text-sm font-medium">{format(sessionDate, 'd MMM', { locale: ar })}</p>
                        <p className="text-xs">{session.session_time || format(sessionDate, 'HH:mm')}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{caseTitle}</p>
                        <p className="text-xs text-muted-foreground">{courtName}</p>
                        <p className="text-xs text-primary">{clientName}</p>
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
