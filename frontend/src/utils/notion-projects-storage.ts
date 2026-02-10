/**
 * LocalStorage utilities for managing Notion projects
 */

import type {
  NotionProject,
  NotionProjectCreate,
  NotionProjectUpdate,
} from "#/types/notion-project";

const STORAGE_KEY = "notion-projects";
const ACTIVE_PROJECT_KEY = "active-notion-project-id";

/**
 * Generate a unique ID for a project
 */
function generateId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all projects from localStorage
 */
export function getProjects(): NotionProject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to load Notion projects:", error);
    return [];
  }
}

/**
 * Save projects to localStorage
 */
function saveProjects(projects: NotionProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to save Notion projects:", error);
  }
}

/**
 * Get a specific project by ID
 */
export function getProject(id: string): NotionProject | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Get the currently active project ID
 */
export function getActiveProjectId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the active project ID
 */
export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_KEY, id);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to set active project:", error);
  }
}

/**
 * Clear the active project selection
 */
export function clearActiveProjectId(): void {
  try {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to clear active project:", error);
  }
}

/**
 * Create a new project
 */
export function createProject(data: NotionProjectCreate): NotionProject {
  const projects = getProjects();
  const now = new Date().toISOString();

  const newProject: NotionProject = {
    id: generateId(),
    name: data.name,
    notionToken: data.notionToken,
    databaseId: data.databaseId,
    createdAt: now,
    updatedAt: now,
  };

  projects.push(newProject);
  saveProjects(projects);

  // If this is the first project, set it as active
  if (projects.length === 1) {
    setActiveProjectId(newProject.id);
  }

  return newProject;
}

/**
 * Update an existing project
 */
export function updateProject(
  id: string,
  data: NotionProjectUpdate,
): NotionProject | null {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === id);

  if (index === -1) return null;

  const updatedProject: NotionProject = {
    ...projects[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  projects[index] = updatedProject;
  saveProjects(projects);

  return updatedProject;
}

/**
 * Delete a project
 */
export function deleteProject(id: string): boolean {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) return false;

  saveProjects(filtered);

  // If we deleted the active project, clear the active selection
  if (getActiveProjectId() === id) {
    clearActiveProjectId();
  }

  return true;
}

/**
 * Get the currently active project (full object)
 */
export function getActiveProject(): NotionProject | null {
  const activeId = getActiveProjectId();
  if (!activeId) return null;
  return getProject(activeId);
}
