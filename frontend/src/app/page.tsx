"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { TaskList } from "@/components/task-list";
import { Header } from "@/components/header";
import { TaskStats } from "@/components/task-stats";
import { useWebSocket } from "@/lib/websocket";
import { tasksApi, Task, TaskStats as TaskStatsType } from "@/lib/api";
import toast from "react-hot-toast";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // WebSocket connection for real-time updates
  const {
    isConnected,
    sendMessage,
    error: wsError,
  } = useWebSocket("/ws", {
    onMessage: (message) => {
      console.log("WebSocket message received:", message);

      // Forward agent responses to chat interface
      if (
        message.type === "agent_response" ||
        message.type === "typing_indicator"
      ) {
        if (
          typeof window !== "undefined" &&
          (window as any).__chatWebSocketHandler
        ) {
          (window as any).__chatWebSocketHandler(message);
        }
        return;
      } else if (message.type === "task_list_update") {
        // Refresh task list when tasks are updated
        loadTasks();
        toast.success("Tasks updated!");
      } else if (message.type === "task_created") {
        // Add new task to the list
        if (message.data.task) {
          setTasks((prev) => [message.data.task, ...prev]);
          loadTaskStats();
        }
      }
    },
    onConnect: () => {
      console.log("WebSocket connected");
      toast.success("Connected to real-time updates");
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
      // toast.error('Disconnected from real-time updates');
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
      // toast.error("Connection error occurred");
    },
  });

  // Load tasks from API
  const loadTasks = async () => {
    try {
      const fetchedTasks = await tasksApi.getTasks({ limit: 50 });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  // Load task statistics
  const loadTaskStats = async () => {
    try {
      const stats = await tasksApi.getStats();
      setTaskStats(stats);
    } catch (error) {
      console.error("Error loading task stats:", error);
    }
  };

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadTasks(), loadTaskStats()]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Handle task operations from TaskList component
  const handleTaskUpdate = async (taskId: number, updates: Partial<Task>) => {
    try {
      const updatedTask = await tasksApi.updateTask(taskId, updates);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
      loadTaskStats();
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      await tasksApi.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      loadTaskStats();
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleSendMessage = (message: string) => {
    return sendMessage({
      type: "chat_message",
      data: { message },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="spinner w-12 h-12 mx-auto"></div>
          <p className="text-muted-foreground">
            Loading AI Task Management Agent...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header isConnected={isConnected} connectionError={wsError} />

      <main className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Task Statistics - Compact Header */}
        {taskStats && (
          <div className="px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <TaskStats stats={taskStats} />
          </div>
        )}

        {/* Main Content - Full Height Two Panel Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
          {/* Chat Interface Panel - Left Side */}
          <div className="lg:col-span-2 flex flex-col border-r border-border/50">
            <div className="flex-1 flex flex-col p-4 lg:p-6">
              <div className="flex items-center space-x-3 mb-4 lg:mb-6">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 lg:w-6 lg:h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                    AI Assistant
                  </h2>
                  <p className="text-xs lg:text-sm text-muted-foreground">
                    Chat with your AI task management assistant
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <ChatInterface
                  onSendMessage={handleSendMessage}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </div>

          {/* Task List Panel - Right Side */}
          <div className="lg:col-span-1 flex flex-col bg-muted/30">
            <div className="flex-1 flex flex-col p-4 lg:p-6">
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 lg:w-6 lg:h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-foreground">
                      Your Tasks
                    </h2>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      {tasks.length} total tasks
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <TaskList
                  tasks={tasks}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  onRefresh={loadTasks}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
