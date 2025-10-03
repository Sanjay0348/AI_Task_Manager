"use client";

import { TaskStats as TaskStatsType } from "@/lib/api";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface TaskStatsProps {
  stats: TaskStatsType;
}

export function TaskStats({ stats }: TaskStatsProps) {
  const statusIcons = {
    done: CheckCircle,
    pending: Circle,
    in_progress: Clock,
    cancelled: AlertTriangle,
  };

  const statusColors = {
    done: "text-green-500",
    pending: "text-yellow-500",
    in_progress: "text-blue-500",
    cancelled: "text-red-500",
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Task Overview</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {stats.total_tasks} total tasks
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-3">
        {/* Total Tasks */}
        <div className="flex items-center space-x-2">
          <div className="text-lg font-bold text-foreground">
            {stats.total_tasks}
          </div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>

        {/* Tasks by Status */}
        {Object.entries(stats.by_status).map(([status, count]) => {
          const Icon =
            statusIcons[status as keyof typeof statusIcons] || Circle;
          const colorClass =
            statusColors[status as keyof typeof statusColors] ||
            "text-gray-500";

          return (
            <div key={status} className="flex items-center space-x-2">
              <Icon className={`h-4 w-4 ${colorClass}`} />
              <div className="text-sm font-medium text-foreground">{count}</div>
              <div className="text-xs text-muted-foreground capitalize hidden sm:block">
                {status.replace("_", " ")}
              </div>
            </div>
          );
        })}

        {/* Overdue Tasks */}
        {stats.overdue_tasks > 0 && (
          <div className="flex items-center space-x-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div className="text-sm font-bold text-red-600 dark:text-red-400">
              {stats.overdue_tasks}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 hidden sm:block">
              Overdue
            </div>
          </div>
        )}

        {/* Priority Distribution */}
        <div className="flex items-center space-x-3">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Priority:
          </span>
          {Object.entries(stats.by_priority).map(([priority, count]) => {
            const priorityColors = {
              low: "bg-gray-500",
              medium: "bg-yellow-500",
              high: "bg-orange-500",
              urgent: "bg-red-500",
            };
            const bgColor =
              priorityColors[priority as keyof typeof priorityColors] ||
              "bg-gray-500";

            return (
              <div key={priority} className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${bgColor}`}></div>
                <span className="text-xs text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
