// Google Calendar API Service

// Configuration using the credentials from your JSON file
const googleAuthConfig = {
  clientId: '159660209536-2oo1cau2ub5js04lsal1k5col0glhrcr.apps.googleusercontent.com',
  apiKey: 'AIzaSyA284X29hAiHqBTIr2QZ78ltO32X8y8ROQ',
  scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
};

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

// Google Calendar Event interface
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string; // Used to identify event type
  extendedProperties?: {
    private?: {
      caseId?: string;
      caseName?: string;
      eventType?: string;
    };
  };
}

/**
 * Load the Google API script
 * @returns Promise that resolves when the script is loaded
 */
export const loadGoogleApi = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if the script is already loaded
    if (typeof window !== 'undefined' && window.gapi) {
      console.log('Google API already loaded');
      loadGapiClient()
        .then(() => resolve(true))
        .catch((error) => {
          console.error('Error loading GAPI client:', error);
          resolve(false);
        });
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;

    // Set up callbacks
    let attempts = 0;
    const maxAttempts = 50; // About 5 seconds total
    
    const checkGapiLoaded = () => {
      if (typeof window !== 'undefined' && window.gapi) {
        clearInterval(interval);
        console.log('Google API script loaded');
        loadGapiClient()
          .then(() => resolve(true))
          .catch((error) => {
            console.error('Error loading GAPI client:', error);
            resolve(false);
          });
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        console.error('Google API script failed to load after multiple attempts');
        resolve(false);
      }
      attempts++;
    };

    // Set up error handler
    script.onerror = () => {
      console.error('Error loading Google API script');
      document.body.removeChild(script);
      resolve(false);
    };

    // Append script to body
    document.body.appendChild(script);

    // Check periodically if gapi is loaded
    const interval = setInterval(checkGapiLoaded, 100);
  });
};

/**
 * Load the GAPI client with Calendar API
 */
const loadGapiClient = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.gapi) {
      reject(new Error('Google API not loaded'));
      return;
    }

    console.log('Loading GAPI client');
    window.gapi.load('client:auth2', {
      callback: () => {
        console.log('GAPI client loaded');
        
        // Initialize the client
        window.gapi.client
          .init({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar',
          })
          .then(() => {
            console.log('GAPI client initialized');
            resolve();
          })
          .catch((error: any) => {
            console.error('Error initializing GAPI client:', error);
            
            // Check for third-party cookie errors
            if (error.error === 'idpiframe_initialization_failed' || 
                (error.details && error.details.includes('cookies'))) {
              reject(new Error('Third-party cookies are blocked in your browser. Please enable them for this site.'));
            } else {
              reject(error);
            }
          });
      },
      onerror: () => {
        console.error('Error loading GAPI client');
        reject(new Error('Failed to load Google API client'));
      },
    });
  });
};

/**
 * Sign in to Google Calendar
 * @returns Promise that resolves with the auth token
 */
export const signInToGoogleCalendar = async (): Promise<string | null> => {
  try {
    if (!window.gapi || !window.gapi.auth2) {
      console.error('Google Auth API not loaded');
      throw new Error('Google Auth API not loaded. Please refresh the page and try again.');
    }

    // Get the GoogleAuth instance
    const googleAuth = window.gapi.auth2.getAuthInstance();
    
    if (!googleAuth) {
      console.error('Google Auth instance not available');
      throw new Error('Google Auth initialization failed');
    }

    // Check if user is already signed in
    if (googleAuth.isSignedIn.get()) {
      const user = googleAuth.currentUser.get();
      const authResponse = user.getAuthResponse();
      return authResponse.access_token;
    }

    console.log('Signing in to Google');
    
    try {
      // Sign in with popup
      const user = await googleAuth.signIn({
        prompt: 'select_account',
      });
      
      // Check if sign-in was successful
      if (!user) {
        console.error('Sign-in failed: No user returned');
        return null;
      }

      const authResponse = user.getAuthResponse();
      return authResponse.access_token;
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      // Handle specific error cases
      if (error.error === 'popup_blocked_by_browser') {
        throw new Error('Sign-in popup blocked');
      } else if (error.error === 'access_denied' || 
                (error.error === 'popup_closed_by_user' && !googleAuth.isSignedIn.get())) {
        throw new Error('User denied access');
      } else if (error.error === 'idpiframe_initialization_failed') {
        throw new Error('Third-party cookies are blocked in your browser');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error signing in to Google Calendar:', error);
    throw error;
  }
};

// Mock function to fetch calendar events in dev mode
export async function fetchCalendarEvents(start: Date, end: Date, accessToken: string): Promise<CalendarEvent[]> {
  // In development without Google API key, return mock data
  if (process.env.NODE_ENV === 'development' && (!accessToken || accessToken === 'mock-token')) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return getMockEvents();
  }
  
  // In production, use the actual Google Calendar API
  try {
    const startDateTime = start.toISOString();
    const endDateTime = end.toISOString();
    
    await window.gapi.client.load('calendar', 'v3');
    
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': startDateTime,
      'timeMax': endDateTime,
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
    
    const events = response.result.items;
    return convertGoogleEventsToAppEvents(events);
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
}

// Create a new calendar event
export async function createCalendarEvent(event: Partial<CalendarEvent>, accessToken: string): Promise<CalendarEvent | null> {
  // In development without Google API key, return mock data
  if (process.env.NODE_ENV === 'development' && (!accessToken || accessToken === 'mock-token')) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return createMockEvent(event);
  }
  
  try {
    await window.gapi.client.load('calendar', 'v3');
    
    // Determine color ID based on event type
    let colorId = '0'; // Default blue
    if (event.type === 'session') colorId = '1'; // Blue
    else if (event.type === 'milestone') colorId = '2'; // Green
    else if (event.type === 'task') colorId = '4'; // Purple
    
    // Create the Google Calendar event
    const googleEvent = {
      summary: event.title,
      location: event.location,
      description: event.description,
      start: {
        dateTime: event.start?.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.end?.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: colorId,
      extendedProperties: {
        private: {
          eventType: event.type,
          caseId: event.caseId,
          caseName: event.caseName
        }
      }
    };
    
    const response = await window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': googleEvent
    });
    
    const createdEvent = response.result;
    return {
      id: createdEvent.id,
      title: createdEvent.summary,
      start: new Date(createdEvent.start.dateTime),
      end: new Date(createdEvent.end.dateTime),
      type: event.type || 'other',
      description: createdEvent.description,
      location: createdEvent.location,
      caseId: event.caseId,
      caseName: event.caseName
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

// Mock functions for development
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

// Helper function to convert Google Calendar events to our app's format
function convertGoogleEventsToAppEvents(googleEvents: GoogleCalendarEvent[]): CalendarEvent[] {
  return googleEvents.map(event => {
    let eventType = 'other';
    let caseId = '';
    let caseName = '';
    
    // Extract event type and case info from extended properties
    if (event.extendedProperties?.private) {
      eventType = event.extendedProperties.private.eventType || 'other';
      caseId = event.extendedProperties.private.caseId || '';
      caseName = event.extendedProperties.private.caseName || '';
    } else {
      // Fallback to determine type based on color
      if (event.colorId === '1') eventType = 'session';
      else if (event.colorId === '2') eventType = 'milestone';
      else if (event.colorId === '4') eventType = 'task';
    }
    
    return {
      id: event.id,
      title: event.summary,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      type: eventType,
      description: event.description,
      location: event.location,
      caseId,
      caseName
    };
  });
}

// Add TypeScript interface for Google API when loaded
declare global {
  interface Window {
    gapi: any;
  }
} 