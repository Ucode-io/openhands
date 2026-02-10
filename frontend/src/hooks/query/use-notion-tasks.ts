import { useQuery } from "@tanstack/react-query";
import NotionTaskService, {
  NotionTask,
} from "#/api/notion-service/notion-service.api";
import { getActiveProject } from "#/utils/notion-projects-storage";
import { useState, useEffect } from "react";

/**
 * Hook to fetch Notion tasks from the configured database (or active project)
 * @param statusFilter - Optional filter by status (e.g., 'To Do', 'Bug')
 * @param enabled - Whether the query should be enabled (default: based on Notion configuration)
 */
export function useNotionTasks(statusFilter?: string, enabled?: boolean) {
  // Track active project reactively
  const [activeProject, setActiveProject] = useState(() => getActiveProject());
  const activeProjectId = activeProject?.id || null;

  // Poll for active project changes (every 500ms is enough for UI responsiveness)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentProject = getActiveProject();
      const currentId = currentProject?.id || null;
      const activeId = activeProject?.id || null;

      if (currentId !== activeId) {
        setActiveProject(currentProject);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeProject]);

  const hasActiveProject = activeProject !== null;
  const shouldFetch = enabled !== undefined ? enabled : hasActiveProject;

  return useQuery<NotionTask[], Error>({
    // Include active project ID in query key to force refetch on change
    queryKey: ["notion-tasks", statusFilter, activeProjectId],
    queryFn: () => {
      if (activeProject) {
        return NotionTaskService.getTasks(statusFilter, 100, {
          token: activeProject.notionToken,
          databaseId: activeProject.databaseId
        });
      }
      return NotionTaskService.getTasks(statusFilter);
    },
    enabled: shouldFetch,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });
}
