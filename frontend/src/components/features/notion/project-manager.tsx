import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SiNotion } from "react-icons/si";
import { FiPlus, FiTrash2, FiEdit2, FiCheck } from "react-icons/fi";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  setActiveProjectId,
  getActiveProjectId
} from "#/utils/notion-projects-storage";
import { NotionProject } from "#/types/notion-project";
import { displaySuccessToast, displayErrorToast } from "#/utils/custom-toast-handlers";

export function ProjectManager() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<NotionProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    notionToken: "",
    databaseId: ""
  });

  const refreshProjects = () => {
    setProjects(getProjects());
    setActiveId(getActiveProjectId());
  };

  useEffect(() => {
    refreshProjects();
    // Poll for external changes (e.g. from sidebar selector)
    const interval = setInterval(refreshProjects, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.notionToken || !formData.databaseId) {
      displayErrorToast("Please fill in all fields");
      return;
    }

    if (editingId) {
      updateProject(editingId, formData);
      displaySuccessToast("Project updated");
    } else {
      createProject(formData);
      displaySuccessToast("Project created");
    }

    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: "", notionToken: "", databaseId: "" });
    refreshProjects();
  };

  const handleEdit = (project: NotionProject) => {
    setFormData({
      name: project.name,
      notionToken: project.notionToken,
      databaseId: project.databaseId
    });
    setEditingId(project.id);
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
      displaySuccessToast("Project deleted");
      refreshProjects();
    }
  };

  const handleSetActive = (id: string) => {
    setActiveProjectId(id);
    setActiveId(id);
    displaySuccessToast("Active project updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Notion Projects</h3>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors text-white"
          >
            <FiPlus /> <span>New Project</span>
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h4 className="text-lg font-medium text-white">{editingId ? "Edit Project" : "New Project"}</h4>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Project Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-zinc-500"
              placeholder="e.g. My Startup"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Notion Integration Token</label>
            <input
              type="password"
              value={formData.notionToken}
              onChange={(e) => setFormData({...formData, notionToken: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-zinc-500"
              placeholder="secret_..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Notion Database ID</label>
            <input
              type="text"
              value={formData.databaseId}
              onChange={(e) => setFormData({...formData, databaseId: e.target.value})}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-zinc-500"
              placeholder="32-char ID from URL"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white"
            >
              <span>Save Project</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingId(null);
                setFormData({ name: "", notionToken: "", databaseId: "" });
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-zinc-300"
            >
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {projects.length === 0 && !isCreating && (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-xl border-dashed">
            <SiNotion className="mx-auto w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-zinc-400"><span>No projects yet</span></h3>
            <p className="text-zinc-500 mb-4"><span>Add your first Notion project to get started</span></p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium"
            >
              <span>Create Project</span>
            </button>
          </div>
        )}

        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleSetActive(project.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              activeId === project.id
                ? "bg-blue-900/10 border-blue-500/50"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  activeId === project.id ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"
                }`}>
                  <SiNotion className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white flex items-center gap-2">
                    {project.name}
                    {activeId === project.id && (
                      <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-400 rounded-full font-bold uppercase tracking-wider">
                        <span>Active</span>
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    <span>Database ID: {project.databaseId.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeId !== project.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetActive(project.id);
                    }}
                    className="p-2 text-zinc-500 hover:text-blue-400 transition-colors"
                    title="Set as Active"
                  >
                    <FiCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  title="Edit"
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id);
                  }}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
