"use client"

import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd"
import { 
  Plus, 
  MoreVertical, 
  Calendar, 
  User, 
  Briefcase
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

// Task type definition
export interface TodoTask {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "done"
  priority: "low" | "medium" | "high"
  due_date: string | null
  case_id: string | null
  case_name?: string
  assigned_to: string | null
  assigned_name?: string
  created_at: string
}

// Status columns configuration
export const todoColumns = [
  {
    id: "todo",
    title: "المهام الجديدة",
    color: "bg-blue-500"
  },
  {
    id: "in-progress",
    title: "قيد التنفيذ",
    color: "bg-yellow-500"
  },
  {
    id: "done",
    title: "مكتملة",
    color: "bg-green-500"
  }
]

interface TodoProps {
  tasks: TodoTask[]
  onTaskDragEnd: (result: DropResult) => void
  onEditTask: (task: TodoTask) => void
  onDeleteTask: (taskId: string) => void
  isLoading?: boolean
}

export default function Todo({
  tasks,
  onTaskDragEnd,
  onEditTask,
  onDeleteTask,
  isLoading = false
}: TodoProps) {
  // Render priority badge
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">عالية</Badge>
      case 'medium':
        return <Badge variant="default">متوسطة</Badge>
      case 'low':
        return <Badge variant="outline">منخفضة</Badge>
      default:
        return null
    }
  }
  
  // Get tasks for a specific column
  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.status === columnId)
  }

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onTaskDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {todoColumns.map(column => (
              <div key={column.id} className="flex flex-col h-full">
                <div className={`px-4 py-2 rounded-t-lg ${column.color} text-white font-semibold flex justify-between items-center`}>
                  <h2>{column.title}</h2>
                  <span className="bg-white text-gray-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                    {getTasksForColumn(column.id).length}
                  </span>
                </div>
                
                <Droppable droppableId={column.id} isDropDisabled={false}>
                  {(provided: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-muted p-3 rounded-b-lg flex-grow min-h-[500px]"
                    >
                      {getTasksForColumn(column.id).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <p>لا توجد مهام</p>
                        </div>
                      ) : (
                        getTasksForColumn(column.id).map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided: any) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-3 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex justify-between items-start">
                                    <CardTitle className="text-base">{task.title}</CardTitle>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                                          تعديل
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                          className="text-destructive"
                                          onClick={() => onDeleteTask(task.id)}
                                        >
                                          حذف
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  {task.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {task.description.length > 100 
                                        ? `${task.description.substring(0, 100)}...` 
                                        : task.description}
                                    </p>
                                  )}
                                  <div className="flex justify-between items-center">
                                    {renderPriorityBadge(task.priority)}
                                  </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex flex-col items-start gap-1">
                                  {task.due_date && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5 ml-1" />
                                      <span>{format(new Date(task.due_date), 'dd/MM/yyyy', { locale: ar })}</span>
                                    </div>
                                  )}
                                  {task.case_name && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <Briefcase className="h-3.5 w-3.5 ml-1" />
                                      <span>{task.case_name}</span>
                                    </div>
                                  )}
                                  {task.assigned_name && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <User className="h-3.5 w-3.5 ml-1" />
                                      <span>{task.assigned_name}</span>
                                    </div>
                                  )}
                                </CardFooter>
                              </Card>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
} 