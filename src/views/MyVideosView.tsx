import React, { useState } from 'react';
import {
  Film,
  Search,
  Plus,
  Play,
  Clock,
  Trash2,
  Edit3,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';

interface MyVideosViewProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onEditProject: (projectId: string) => void;
  onRegenerateProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateClick: () => void;
}

export const MyVideosView: React.FC<MyVideosViewProps> = ({
  projects,
  onOpenProject,
  onEditProject,
  onRegenerateProject,
  onDeleteProject,
  onCreateClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div id="my-videos-container" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">My Videos</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage your library of generated faceless video projects ({projects.length} total)
          </p>
        </div>

        <button
          id="my-videos-create-btn"
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Video</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or topic..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'completed', 'VIDEO_GENERATED', 'SCENES_READY', 'SCRIPTED', 'draft'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All' : st === 'VIDEO_GENERATED' ? 'Generated' : st === 'SCENES_READY' ? 'Scenes Ready' : st === 'SCRIPTED' ? 'Scripted' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-16 text-center">
          <Film className="h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-200">No videos found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {searchQuery
              ? 'No projects matched your search criteria.'
              : 'You have not created any video projects yet.'}
          </p>
          <button
            type="button"
            onClick={onCreateClick}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
          >
            Create Your First Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              id={`video-card-${project.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-md transition-all hover:border-indigo-500/60 hover:shadow-xl"
            >
              {/* Media Thumbnail Container */}
              <div
                onClick={() => onOpenProject(project.id)}
                className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-slate-950"
              >
                <div className="flex h-full w-full items-center justify-center bg-indigo-950/20 text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                  <Film className="h-10 w-10 opacity-30" />
                </div>

                {/* Status Pill */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md ${
                      project.status === 'completed' || project.status === 'VIDEO_GENERATED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : project.status === 'SCENES_READY'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : project.status === 'SCRIPTED' || project.status === 'scripted'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : project.status === 'CREATING' || project.status === 'generating'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                        : project.status === 'failed'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {project.status === 'VIDEO_GENERATED' ? 'READY' : project.status}
                  </span>
                </div>

                {/* Aspect Ratio & Duration badges */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {project.aspectRatio}
                  </span>
                  <span className="rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {project.duration}
                  </span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div onClick={() => onOpenProject(project.id)} className="cursor-pointer">
                  <h3 className="line-clamp-1 text-sm font-bold text-white group-hover:text-indigo-400">
                    {project.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {project.topic}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{project.language}</span>
                    <span>•</span>
                    <span>{project.contentStyle}</span>
                    <span>•</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Toolbar */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <button
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Open</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditProject(project.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title="Edit scenes and script"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRegenerateProject(project.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-indigo-400"
                      title="Regenerate project"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete project "${project.title}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                      title="Delete video"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
