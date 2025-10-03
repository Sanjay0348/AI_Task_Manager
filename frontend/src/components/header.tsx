"use client";

import { ThemeToggle } from "./theme-toggle";
import { Wifi, WifiOff, Brain, CheckSquare } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  connectionError?: string | null;
}

export function Header({ isConnected, connectionError }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Brain className="h-8 w-8 text-primary" />
              <CheckSquare className="absolute -bottom-1 -right-1 h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                AI Task Manager
              </h1>
              <p className="text-xs text-muted-foreground">
                Natural Language Task Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline text-green-600 dark:text-green-400">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="hidden sm:inline text-red-600 dark:text-red-400">
                  {connectionError ? "Error" : "Disconnected"}
                </span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
