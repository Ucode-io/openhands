import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SiNotion } from "react-icons/si";
import { FiSearch, FiExternalLink, FiChevronDown, FiX } from "react-icons/fi";
import { NotionTask } from "#/api/notion-service/notion-service.api";
import { useNotionTasks } from "#/hooks/query/use-notion-tasks";
import { useSettings } from "#/hooks/query/use-settings";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";

interface NotionBugSelectorProps {
  onSelectTask: (task: NotionTask, message: string) => void;
  selectedTask: NotionTask | null;
  onClearTask: () => void;
  className?: string;
}

/**
 * Component for selecting and working with Notion bugs/tasks
 * Displays a searchable dropdown of tasks from the configured Notion database
 */
export function NotionBugSelector({
  onSelectTask,
  selectedTask,
  onClearTask,
  className,
}: NotionBugSelectorProps) {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if Notion is configured
  const isNotionConfigured = settings?.notion_api_key_set === true;

  // Fetch only "Not started" tasks from the API when dropdown is open
  const { data: tasks = [], isLoading, error } = useNotionTasks("Not started", isOpen && isNotionConfigured);

  // Apply search query to the already-filtered tasks
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) {
      return tasks;
    }
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.status?.toLowerCase().includes(query) ||
        task.priority?.toLowerCase().includes(query),
    );
  }, [tasks, searchQuery]);

  // Generate the message for the selected task
  const generateTaskMessage = useCallback((task: NotionTask): string => {
    const description = task.description
      ? task.description.slice(0, 500) + (task.description.length > 500 ? "..." : "")
      : "No description provided";

    return `I have selected Notion task "${task.title}". Here is the description: ${description}. Please fix this issue in the workspace.`;
  }, []);

  // Handle task selection
  const handleSelectTask = useCallback(
    (task: NotionTask) => {
      setIsOpen(false);
      setSearchQuery("");
      const message = generateTaskMessage(task);
      onSelectTask(task, message);
    },
    [onSelectTask, generateTaskMessage],
  );

  // Don't render if Notion is not configured
  if (!isNotionConfigured) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50",
          "text-zinc-300 hover:text-white",
          isOpen && "ring-2 ring-blue-500/50 border-blue-500/50",
        )}
      >
        <SiNotion className="w-4 h-4" />
        <span className="hidden sm:inline">
          {selectedTask ? selectedTask.title.slice(0, 20) + "..." : t(I18nKey.INTEGRATIONS$NOTION)}
        </span>
        <FiChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown Panel - opens upward */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-80 sm:w-96 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-zinc-800">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bugs and tasks..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                autoFocus
              />
            </div>
          </div>

          {/* Task List */}
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-zinc-600 border-t-blue-500"></div>
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-400">Failed to load tasks</p>
                <p className="text-xs text-zinc-500 mt-1">{error.message}</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <SiNotion className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-500">
                  {searchQuery ? "No tasks found" : "No tasks in database"}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filteredTasks.map((task) => (
                  <button
                    key={task.page_id}
                    type="button"
                    onClick={() => handleSelectTask(task)}
                    className="w-full px-4 py-3 text-left hover:bg-zinc-800/80 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.status && (
                            <span
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full",
                                task.status.toLowerCase() === "to do" &&
                                  "bg-yellow-500/20 text-yellow-400",
                                task.status.toLowerCase() === "bug" &&
                                  "bg-red-500/20 text-red-400",
                                task.status.toLowerCase() === "in progress" &&
                                  "bg-blue-500/20 text-blue-400",
                                task.status.toLowerCase() === "done" &&
                                  "bg-green-500/20 text-green-400",
                                !["to do", "bug", "in progress", "done"].includes(
                                  task.status.toLowerCase(),
                                ) && "bg-zinc-700/50 text-zinc-400",
                              )}
                            >
                              {task.status}
                            </span>
                          )}
                          {task.priority && (
                            <span
                              className={cn(
                                "px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full",
                                task.priority.toLowerCase() === "high" &&
                                  "bg-red-500/20 text-red-400",
                                task.priority.toLowerCase() === "medium" &&
                                  "bg-yellow-500/20 text-yellow-400",
                                task.priority.toLowerCase() === "low" &&
                                  "bg-green-500/20 text-green-400",
                                !["high", "medium", "low"].includes(
                                  task.priority.toLowerCase(),
                                ) && "bg-zinc-700/50 text-zinc-400",
                              )}
                            >
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-zinc-700/50 transition-all"
                      >
                        <FiExternalLink className="w-4 h-4 text-zinc-400" />
                      </a>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-zinc-800/50 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
