"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Trash2, 
  PenSquare, 
  CalendarDays, 
  CheckCircle, 
  Calendar, 
  Gavel, 
  FileText, 
  AlertTriangle, 
  Clock 
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { CaseEvent, CaseEventFormData } from "@/app/actions/case-event-actions"
import { addCaseEvent, updateCaseEvent, deleteCaseEvent } from "@/app/actions/case-event-actions"
import { Checkbox } from "@/components/ui/checkbox"

interface CaseTimelineProps {
  caseId: string
}

// Define event types and their properties
const EVENT_TYPES = [
  { value: "hearing", label: "جلسة استماع", icon: Calendar },
  { value: "decision", label: "قرار المحكمة", icon: Gavel },
  { value: "filing", label: "تقديم مستند", icon: FileText },
  { value: "postponement", label: "تأجيل", icon: Clock },
  { value: "other", label: "أخرى", icon: CalendarDays },
]

export default function CaseTimeline({ caseId }: CaseTimelineProps) {
  const [events, setEvents] = useState<CaseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<CaseEvent | null>(null)
  
  const [newEvent, setNewEvent] = useState<CaseEventFormData>({
    case_id: caseId,
    event_date: new Date().toISOString().split('T')[0],
    event_type: "other",
    title: "",
    description: "",
    is_decision: false
  })
  
  const supabase = createClientComponentClient()
  
  // Fetch case events
  const fetchEvents = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from("case_events")
        .select("*")
        .eq("case_id", caseId)
        .order("event_date", { ascending: false })
      
      if (error) {
        throw error
      }
      
      setEvents(data || [])
    } catch (err) {
      console.error("Error fetching case events:", err)
      setError("فشل في جلب أحداث القضية. الرجاء المحاولة مرة أخرى لاحقًا.")
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchEvents()
  }, [caseId])
  
  // Handlers for events
  const handleAddEvent = async () => {
    try {
      const result = await addCaseEvent(newEvent)
      
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success("تمت إضافة الحدث بنجاح")
        setAddDialogOpen(false)
        // Reset form
        setNewEvent({
          case_id: caseId,
          event_date: new Date().toISOString().split('T')[0],
          event_type: "other",
          title: "",
          description: "",
          is_decision: false
        })
        // Refresh the list
        fetchEvents()
      }
    } catch (error) {
      console.error("Error adding event:", error)
      toast.error("حدث خطأ أثناء إضافة الحدث")
    }
  }
  
  const handleEditEvent = async () => {
    if (!currentEvent) return
    
    try {
      const eventToUpdate: CaseEventFormData = {
        id: currentEvent.id,
        case_id: currentEvent.case_id,
        event_date: currentEvent.event_date,
        event_type: currentEvent.event_type,
        title: currentEvent.title,
        description: currentEvent.description || undefined,
        is_decision: currentEvent.is_decision
      }
      
      const result = await updateCaseEvent(eventToUpdate)
      
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success("تم تحديث الحدث بنجاح")
        setEditDialogOpen(false)
        setCurrentEvent(null)
        // Refresh the list
        fetchEvents()
      }
    } catch (error) {
      console.error("Error updating event:", error)
      toast.error("حدث خطأ أثناء تحديث الحدث")
    }
  }
  
  const handleDeleteEvent = async () => {
    if (!currentEvent) return
    
    try {
      const result = await deleteCaseEvent(currentEvent.id, caseId)
      
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else {
        toast.success("تم حذف الحدث بنجاح")
        setDeleteDialogOpen(false)
        setCurrentEvent(null)
        // Refresh the list
        fetchEvents()
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      toast.error("حدث خطأ أثناء حذف الحدث")
    }
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }
    return new Date(dateString).toLocaleDateString('en-US', options)
  }
  
  // Get event type icon
  const getEventTypeIcon = (type: string) => {
    const eventType = EVENT_TYPES.find(et => et.value === type)
    const Icon = eventType?.icon || CalendarDays
    return <Icon className="h-5 w-5" />
  }
  
  // Get event type label
  const getEventTypeLabel = (type: string) => {
    const eventType = EVENT_TYPES.find(et => et.value === type)
    return eventType?.label || "أخرى"
  }
  
  if (loading) {
    return (
      <div className="border rounded-md p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري تحميل الأحداث...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="border rounded-md p-8 text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchEvents}>
          إعادة المحاولة
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              إضافة حدث
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>إضافة حدث جديد للقضية</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event_date" className="text-right">
                  التاريخ
                </Label>
                <Input
                  id="event_date"
                  type="date"
                  className="col-span-3"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event_type" className="text-right">
                  نوع الحدث
                </Label>
                <Select 
                  value={newEvent.event_type} 
                  onValueChange={(value) => setNewEvent({ ...newEvent, event_type: value })}
                >
                  <SelectTrigger id="event_type" className="col-span-3">
                    <SelectValue placeholder="اختر نوع الحدث" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event_title" className="text-right">
                  العنوان
                </Label>
                <Input
                  id="event_title"
                  className="col-span-3"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event_description" className="text-right">
                  الوصف
                </Label>
                <Textarea
                  id="event_description"
                  className="col-span-3"
                  rows={3}
                  value={newEvent.description || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div></div>
                <div className="col-span-3 flex items-center space-x-2">
                  <Checkbox 
                    id="is_decision" 
                    checked={newEvent.is_decision} 
                    onCheckedChange={(checked) => setNewEvent({ ...newEvent, is_decision: !!checked })}
                  />
                  <label
                    htmlFor="is_decision"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                  >
                    هذا حدث مهم (قرار قضائي)
                  </label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="button" onClick={handleAddEvent}>
                إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          لا توجد أحداث في الجدول الزمني بعد. انقر على زر "إضافة حدث" لإضافة حدث جديد.
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="relative mr-5">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 right-4 w-0.5 bg-gray-200"></div>
            
            {/* Events */}
            <div className="space-y-0">
              {events.map((event) => (
                <div key={event.id} className="relative pt-5 pb-5">
                  {/* Timeline dot */}
                  <div className={`absolute right-4 top-6 w-3 h-3 rounded-full -translate-x-1.5 border-2 border-white ${
                    event.is_decision ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                  
                  {/* Event content */}
                  <div className="mr-12 pr-4">
                    <Card className={`border-r-4 ${event.is_decision ? 'border-r-green-500' : 'border-r-blue-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-muted-foreground text-sm">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            {formatDate(event.event_date)}
                            <div className="mx-2">•</div>
                            <div className="flex items-center">
                              {getEventTypeIcon(event.event_type)}
                              <span className="mr-1">{getEventTypeLabel(event.event_type)}</span>
                            </div>
                            {event.is_decision && (
                              <>
                                <div className="mx-2">•</div>
                                <div className="flex items-center text-green-600">
                                  <Gavel className="h-4 w-4 mr-1" />
                                  <span>قرار قضائي</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setCurrentEvent(event)}
                                >
                                  <PenSquare className="h-4 w-4" />
                                  <span className="sr-only">تعديل</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>تعديل الحدث</DialogTitle>
                                </DialogHeader>
                                
                                {currentEvent && (
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_event_date" className="text-right">
                                        التاريخ
                                      </Label>
                                      <Input
                                        id="edit_event_date"
                                        type="date"
                                        className="col-span-3"
                                        value={currentEvent.event_date}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}
                                        required
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_event_type" className="text-right">
                                        نوع الحدث
                                      </Label>
                                      <Select 
                                        value={currentEvent.event_type} 
                                        onValueChange={(value) => setCurrentEvent({ ...currentEvent, event_type: value })}
                                      >
                                        <SelectTrigger id="edit_event_type" className="col-span-3">
                                          <SelectValue placeholder="اختر نوع الحدث" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {EVENT_TYPES.map(type => {
                                            const Icon = type.icon;
                                            return (
                                              <SelectItem key={type.value} value={type.value}>
                                                <div className="flex items-center">
                                                  <Icon className="h-4 w-4 mr-2" />
                                                  <span>{type.label}</span>
                                                </div>
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_event_title" className="text-right">
                                        العنوان
                                      </Label>
                                      <Input
                                        id="edit_event_title"
                                        className="col-span-3"
                                        value={currentEvent.title}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })}
                                        required
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="edit_event_description" className="text-right">
                                        الوصف
                                      </Label>
                                      <Textarea
                                        id="edit_event_description"
                                        className="col-span-3"
                                        rows={3}
                                        value={currentEvent.description || ""}
                                        onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                                      />
                                    </div>
                                    
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <div></div>
                                      <div className="col-span-3 flex items-center space-x-2">
                                        <Checkbox 
                                          id="edit_is_decision" 
                                          checked={currentEvent.is_decision}
                                          onCheckedChange={(checked) => setCurrentEvent({ ...currentEvent, is_decision: !!checked })}
                                        />
                                        <label
                                          htmlFor="edit_is_decision"
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                                        >
                                          هذا حدث مهم (قرار قضائي)
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setCurrentEvent(null)}>
                                    إلغاء
                                  </Button>
                                  <Button type="button" onClick={handleEditEvent}>
                                    حفظ التغييرات
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setCurrentEvent(event)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">حذف</span>
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-lg">{event.title}</h3>
                          {event.description && (
                            <p className="text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الحدث</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الحدث؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentEvent(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
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