// Microsoft Graph API Service

// Configuration (would typically come from environment variables)
const msalConfig = {
  clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || 'your-client-id',
  authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'common'}`,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  scopes: ['Calendars.ReadWrite', 'User.Read']
};

// Event interface matching the Microsoft Graph API response
export interface MsGraphEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  body?: {
    contentType: string;
    content: string;
  };
  bodyPreview?: string;
  categories?: string[];
}

// Calendar Event interface for our app
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: string;
  description?: string;
  location?: string;
  caseId?: string;
  caseName?: string;
}

// Mock authentication function (to be replaced with actual MSAL implementation)
export async function signInToMicrosoftGraph(): Promise<string | null> {
  // In a real implementation, this would use MSAL.js to authenticate with Microsoft
  // and return an access token
  
  // Simulate authentication delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate successful authentication
  return "mock-access-token";
}

// Mock function to fetch calendar events (to be replaced with actual Graph API calls)
export async function fetchCalendarEvents(start: Date, end: Date, accessToken: string): Promise<CalendarEvent[]> {
  // In real implementation, this would call Microsoft Graph API with the access token
  // and fetch actual calendar events
  
  // For now, return mock data
  const mockEvents: CalendarEvent[] = [
    {
      id: "1",
      title: "جلسة قضية الشركة ضد المورد",
      start: new Date(2023, 7, 15, 10, 0),
      end: new Date(2023, 7, 15, 11, 30),
      type: "session",
      caseId: "case123",
      caseName: "الشركة ضد المورد",
      location: "المحكمة التجارية - الرياض"
    },
    {
      id: "2",
      title: "تسليم المستندات للمحكمة",
      start: new Date(2023, 7, 20, 9, 0),
      end: new Date(2023, 7, 20, 9, 30),
      type: "milestone",
      caseId: "case123",
      caseName: "الشركة ضد المورد"
    },
    {
      id: "3",
      title: "اجتماع مع العميل لمناقشة التسوية",
      start: new Date(2023, 7, 18, 14, 0),
      end: new Date(2023, 7, 18, 15, 0),
      type: "task",
      caseId: "case456",
      caseName: "قضية عبدالله النوفلي"
    },
    {
      id: "4",
      title: "جلسة قضية النوفلي",
      start: new Date(2023, 7, 25, 11, 0),
      end: new Date(2023, 7, 25, 12, 30),
      type: "session",
      caseId: "case456",
      caseName: "قضية عبدالله النوفلي",
      location: "المحكمة الإدارية - الرياض"
    },
    {
      id: "5",
      title: "موعد تسليم المذكرة",
      start: new Date(2023, 7, 28, 9, 0),
      end: new Date(2023, 7, 28, 10, 0),
      type: "milestone",
      caseId: "case789",
      caseName: "شركة الأمل ضد المقاول"
    }
  ];
  
  return mockEvents;
}

// Mock function to create a new event (to be replaced with actual Graph API calls)
export async function createCalendarEvent(event: Partial<CalendarEvent>, accessToken: string): Promise<CalendarEvent | null> {
  // In a real implementation, this would call the Microsoft Graph API to create a new event
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a mock response
  const newEvent: CalendarEvent = {
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
  
  return newEvent;
}

// Mock function to update an event
export async function updateCalendarEvent(eventId: string, eventUpdate: Partial<CalendarEvent>, accessToken: string): Promise<boolean> {
  // In a real implementation, this would call the Microsoft Graph API to update an event
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful update
  return true;
}

// Mock function to delete an event
export async function deleteCalendarEvent(eventId: string, accessToken: string): Promise<boolean> {
  // In a real implementation, this would call the Microsoft Graph API to delete an event
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate successful deletion
  return true;
}

// Helper function to convert Microsoft Graph events to our app's format
export function convertGraphEventsToAppEvents(graphEvents: MsGraphEvent[]): CalendarEvent[] {
  return graphEvents.map(event => {
    // Determine event type based on categories
    let type = 'other';
    if (event.categories) {
      if (event.categories.includes('Court Session') || event.categories.includes('جلسة')) {
        type = 'session';
      } else if (event.categories.includes('Milestone') || event.categories.includes('مرحلة')) {
        type = 'milestone';
      } else if (event.categories.includes('Task') || event.categories.includes('مهمة')) {
        type = 'task';
      }
    }
    
    // Try to extract case information from the event body or categories
    let caseId = '';
    let caseName = '';
    if (event.bodyPreview) {
      const caseMatch = event.bodyPreview.match(/case:([a-zA-Z0-9-_]+)/i);
      if (caseMatch && caseMatch[1]) {
        caseId = caseMatch[1];
      }
      
      const caseNameMatch = event.bodyPreview.match(/case name:([^\\n]+)/i);
      if (caseNameMatch && caseNameMatch[1]) {
        caseName = caseNameMatch[1].trim();
      }
    }
    
    return {
      id: event.id,
      title: event.subject,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      type,
      description: event.bodyPreview,
      location: event.location?.displayName,
      caseId,
      caseName
    };
  });
}

// In a real implementation, you would include the MSAL library and set up proper authentication:
/*
import * as msal from '@azure/msal-browser';

const msalInstance = new msal.PublicClientApplication(msalConfig);

export async function signInToMicrosoftGraph() {
  try {
    const loginResponse = await msalInstance.loginPopup({
      scopes: msalConfig.scopes,
      prompt: "select_account"
    });
    
    return loginResponse.accessToken;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function fetchCalendarEvents(start: Date, end: Date, accessToken: string) {
  const startDateTime = start.toISOString();
  const endDateTime = end.toISOString();
  
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  
  const data = await response.json();
  return convertGraphEventsToAppEvents(data.value);
}
*/ 