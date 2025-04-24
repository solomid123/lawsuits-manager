"use client"

import { useState, useEffect } from "react"
import { DropResult } from "react-beautiful-dnd"
import { supabaseClient } from "@/lib/supabase-client"
import { Plus, AlertCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Todo, { TodoTask, todoColumns } from "../components/Todo"
import TodoForm from "../components/TodoForm"
import DashboardLayout from "../dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TodoPage() {
  const [tasks, setTasks] = useState<TodoTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cases, setCases] = useState<{ id: string, title: string }[]>([])
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentTask, setCurrentTask] = useState<Partial<TodoTask>>({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: null,
    case_id: null,
    assigned_to: null
  })

  // Fetch tasks, cases, and users on component mount
  useEffect(() => {
    fetchData()
  }, [])

  const createTasksTable = async () => {
    try {
      // Create tasks table if it doesn't exist
      const { error } = await supabaseClient.rpc('create_tasks_table')
      
      if (error) {
        console.error('Error creating tasks table:', error)
        // Try to create it manually if the RPC doesn't exist
        await supabaseClient.rpc('execute_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS tasks (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title VARCHAR(255) NOT NULL,
              description TEXT,
              status VARCHAR(50) NOT NULL DEFAULT 'todo',
              priority VARCHAR(50) DEFAULT 'medium',
              due_date TIMESTAMPTZ,
              case_id UUID REFERENCES cases(id),
              assigned_to UUID,
              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
              created_by UUID
            )
          `
        })
      }
      
      toast.success('تم إنشاء جدول المهام بنجاح')
      await fetchData()
    } catch (error) {
      console.error('Error creating tasks table:', error)
      toast.error('فشل في إنشاء جدول المهام')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if we can connect to Supabase
      const { data: connectionTest, error: connectionError } = await supabaseClient
        .from('tasks')
        .select('count')
        .limit(1)
        .single()
      
      if (connectionError) {
        console.error('Connection error:', connectionError)
        
        // Check if the error is because the table doesn't exist
        if (connectionError.message.includes('does not exist')) {
          setError('جدول المهام غير موجود. هل تريد إنشاءه؟')
          setLoading(false)
          return
        }
        
        setError('حدث خطأ في الاتصال بقاعدة البيانات')
        setLoading(false)
        return
      }
      
      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabaseClient
        .from('tasks')
        .select('id, title, description, status, priority, due_date, case_id, assigned_to, created_at, updated_at')
        .order('created_at', { ascending: false })

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
        throw tasksError
      }

      console.log('Tasks fetched:', tasksData)

      // Fetch cases for dropdown
      let casesData: any[] = []
      try {
        const { data, error: casesError } = await supabaseClient
          .from('cases')
          .select('id, title')

        if (!casesError) {
          casesData = data || []
        } else {
          console.error('Error fetching cases:', casesError)
        }
      } catch (e) {
        console.error('Error in cases fetch:', e)
        casesData = []
      }

      // Fetch users for dropdown
      let usersData: any[] = []
      try {
        // Try 'users' table first
        const { data, error: usersError } = await supabaseClient
          .from('users')
          .select('id, name')

        if (!usersError && data) {
          usersData = data
        } else {
          // If 'users' doesn't work, try 'profiles'
          const { data: profilesData, error: profilesError } = await supabaseClient
            .from('profiles')
            .select('id, name')

          if (!profilesError && profilesData) {
            usersData = profilesData
          } else {
            // Try one more time with 'team_members' table
            const { data: teamData, error: teamError } = await supabaseClient
              .from('team_members')
              .select('id, first_name, last_name')
            
            if (!teamError && teamData) {
              usersData = teamData.map(member => ({
                id: member.id,
                name: `${member.first_name} ${member.last_name}`
              }))
            } else {
              console.error('Error fetching users/profiles/team_members:', usersError || profilesError || teamError)
            }
          }
        }
      } catch (e) {
        console.error('Error in users fetch:', e)
        usersData = []
      }

      // Process tasks to add case name and assigned user name
      const processedTasks = tasksData.map(task => {
        const caseInfo = casesData.find(c => c.id === task.case_id)
        const userInfo = usersData.find(u => u.id === task.assigned_to)
        return {
          ...task,
          case_name: caseInfo?.title,
          assigned_name: userInfo?.name
        }
      })

      setTasks(processedTasks)
      setCases(casesData)
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('فشل في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  // Handle drag and drop of tasks
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // If dropped outside of a droppable area
    if (!destination) return

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Find the task that was dragged
    const task = tasks.find(t => t.id === draggableId)
    if (!task) return

    // Update the task status in the local state (optimistic update)
    const newStatus = destination.droppableId as "todo" | "in-progress" | "done"
    const updatedTasks = tasks.map(t => (
      t.id === draggableId ? { ...t, status: newStatus } : t
    ))
    setTasks(updatedTasks)

    // Update the task in the database
    try {
      const { error } = await supabaseClient
        .from('tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', draggableId)

      if (error) throw error
      
      toast.success('تم تحديث حالة المهمة')
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('فشل في تحديث حالة المهمة')
      
      // Revert the local state if the update failed
      setTasks(tasks)
    }
  }

  // Save a task (create new or update existing)
  const handleSaveTask = async () => {
    if (!currentTask.title) {
      toast.error('عنوان المهمة مطلوب')
      return
    }
    
    try {
      if (isEditing && currentTask.id) {
        // Update existing task
        const { error } = await supabaseClient
          .from('tasks')
          .update({
            title: currentTask.title,
            description: currentTask.description,
            status: currentTask.status,
            priority: currentTask.priority,
            due_date: currentTask.due_date,
            case_id: currentTask.case_id,
            assigned_to: currentTask.assigned_to,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentTask.id)
        
        if (error) throw error
        
        // Update the task in the local state
        setTasks(tasks.map(task => 
          task.id === currentTask.id 
            ? { 
                ...task, 
                ...currentTask as TodoTask,
                case_name: cases.find(c => c.id === currentTask.case_id)?.title,
                assigned_name: users.find(u => u.id === currentTask.assigned_to)?.name
              } 
            : task
        ))
        
        toast.success('تم تحديث المهمة بنجاح')
      } else {
        // Create new task
        const { data, error } = await supabaseClient
          .from('tasks')
          .insert({
            title: currentTask.title,
            description: currentTask.description,
            status: currentTask.status,
            priority: currentTask.priority,
            due_date: currentTask.due_date,
            case_id: currentTask.case_id,
            assigned_to: currentTask.assigned_to,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
        
        if (error) throw error
        
        // Add the new task to the local state
        if (data && data[0]) {
          const newTask = {
            ...data[0],
            case_name: cases.find(c => c.id === currentTask.case_id)?.title,
            assigned_name: users.find(u => u.id === currentTask.assigned_to)?.name
          } as TodoTask
          
          setTasks([newTask, ...tasks])
          toast.success('تم إضافة المهمة بنجاح')
        }
      }
      
      // Reset the form and close the dialog
      setCurrentTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: null,
        case_id: null,
        assigned_to: null
      })
      setIsEditing(false)
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error('فشل في حفظ المهمة')
    }
  }
  
  // Delete a task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      if (error) throw error
      
      // Remove the task from the local state
      setTasks(tasks.filter(task => task.id !== taskId))
      toast.success('تم حذف المهمة بنجاح')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('فشل في حذف المهمة')
    }
  }
  
  // Edit an existing task
  const handleEditTask = (task: TodoTask) => {
    setCurrentTask({
      ...task,
      due_date: task.due_date || null
    })
    setIsEditing(true)
    setDialogOpen(true)
  }
  
  // Add a new task
  const handleAddTask = () => {
    setCurrentTask({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: null,
      case_id: null,
      assigned_to: null
    })
    setIsEditing(false)
    setDialogOpen(true)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">قائمة المهام</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData}>
              <RefreshCcw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 ml-2" />
              مهمة جديدة
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-4">
              <span>{error}</span>
              {error.includes('جدول المهام غير موجود') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={createTasksTable}
                >
                  إنشاء جدول المهام
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-auto" 
                onClick={() => fetchData()}
              >
                إعادة المحاولة
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Todo
          tasks={tasks}
          onTaskDragEnd={handleDragEnd}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          isLoading={loading}
        />
        
        <TodoForm
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentTask={currentTask}
          onTaskChange={setCurrentTask}
          onSave={handleSaveTask}
          isEditing={isEditing}
          cases={cases}
          users={users}
        />
      </div>
    </DashboardLayout>
  )
} 