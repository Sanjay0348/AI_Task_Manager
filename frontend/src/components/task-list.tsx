"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  Clock,
  AlertTriangle,
  Trash2,
  Edit,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Plus,
  MoreVertical,
  X,
} from "lucide-react";
import { Task } from "@/lib/api";
import {
  formatRelativeTime,
  isTaskOverdue,
  getTaskStatusColor,
  getTaskPriorityColor,
  capitalize,
  sortTasks,
  taskStatusOptions,
  taskPriorityOptions,
} from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: number, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: number) => void;
  onRefresh: () => void;
}

export function TaskList({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onRefresh,
}: TaskListProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...tasks];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Sort tasks
    filtered = sortTasks(filtered);

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const handleStatusToggle = (task: Task) => {
    const newStatus = task.status === "done" ? "pending" : "done";
    onTaskUpdate(task.id, { status: newStatus });
  };

  const handleEditStart = (task: Task) => {
    setEditingTask(task.id);
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
    });
  };

  const handleEditSave = () => {
    if (editingTask && editForm.title?.trim()) {
      onTaskUpdate(editingTask, editForm);
      setEditingTask(null);
      setEditForm({});
    }
  };

  const handleEditCancel = () => {
    setEditingTask(null);
    setEditForm({});
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Square className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    const colors = {
      low: "text-gray-500",
      medium: "text-yellow-500",
      high: "text-orange-500",
      urgent: "text-red-500",
    };
    return (
      <AlertTriangle
        className={`w-3 h-3 ${
          colors[priority as keyof typeof colors] || "text-gray-500"
        }`}
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-background/50 rounded-xl border border-border/50 backdrop-blur-sm">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm font-medium text-foreground">
              {filteredTasks.length} tasks
            </span>
          </div>
          {(statusFilter !== "all" ||
            priorityFilter !== "all" ||
            searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
              className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 text-muted-foreground rounded transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              showFilters
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            title="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200"
            title="Refresh tasks"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border/50 bg-background/80 text-foreground rounded-xl focus-ring text-sm shadow-sm backdrop-blur-sm"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/30 animate-slide-down">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border/50 bg-background/80 text-foreground rounded-lg text-sm focus-ring"
                >
                  <option value="all">All Status</option>
                  {taskStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border/50 bg-background/80 text-foreground rounded-lg text-sm focus-ring"
                >
                  <option value="all">All Priority</option>
                  {taskPriorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Square className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-medium mb-1">
              {tasks.length === 0
                ? "No tasks yet"
                : "No tasks match your search"}
            </p>
            <p className="text-xs text-muted-foreground">
              {tasks.length === 0
                ? "Ask the AI to create some tasks!"
                : "Try adjusting your filters"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task: any) => (
            <div
              key={task.id}
              className={`group border border-border/50 rounded-xl p-4 bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-border animate-fade-in ${
                task.status === "done" ? "opacity-75" : ""
              } ${
                isTaskOverdue(task.due_date, task.status)
                  ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
                  : ""
              }`}
            >
              {editingTask === task.id ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.title || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded focus-ring text-sm"
                    placeholder="Task title..."
                  />
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded focus-ring text-sm resize-none"
                    rows={2}
                    placeholder="Task description..."
                  />
                  <div className="flex space-x-2">
                    <select
                      value={editForm.priority || task.priority}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          priority: e.target.value as Task["priority"],
                        })
                      }
                      className="px-2 py-1 border border-input bg-background text-foreground rounded text-sm focus-ring"
                    >
                      {taskPriorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      value={
                        editForm.due_date
                          ? new Date(editForm.due_date)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          due_date: e.target.value || undefined,
                        })
                      }
                      className="px-2 py-1 border border-input bg-background text-foreground rounded text-sm focus-ring"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditSave}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm btn-hover"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm btn-hover"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <div className="flex items-start space-x-3">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleStatusToggle(task)}
                    className="mt-1 hover:bg-accent hover:text-accent-foreground rounded-lg p-2 transition-all duration-200 hover:scale-110"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <h4
                          className={`font-medium text-sm text-foreground truncate ${
                            task.status === "done"
                              ? "line-through opacity-75"
                              : ""
                          }`}
                        >
                          {task.title}
                        </h4>
                        {getPriorityIcon(task.priority)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEditStart(task)}
                          className="p-1.5 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                          title="Edit task"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onTaskDelete(task.id)}
                          className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(
                            task.status
                          )}`}
                        >
                          {capitalize(task.status)}
                        </span>

                        {task.due_date && (
                          <div className="flex items-center space-x-1 text-xs">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span
                              className={
                                isTaskOverdue(task.due_date, task.status)
                                  ? "text-red-500 font-medium"
                                  : "text-muted-foreground"
                              }
                            >
                              {formatRelativeTime(task.due_date)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
