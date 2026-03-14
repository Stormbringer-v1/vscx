import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { projects as projectsApi } from '../lib/api';

interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  created_at: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProjects = async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data);
      if (response.data.length > 0) {
        if (!selectedProject) {
          setSelectedProject(response.data[0]);
        } else {
          const stillExists = response.data.find((p: Project) => p.id === selectedProject.id);
          if (!stillExists) {
            setSelectedProject(response.data[0]);
          }
        }
      } else {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  return (
    <ProjectContext.Provider value={{ projects, selectedProject, setSelectedProject, loading, refreshProjects }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
