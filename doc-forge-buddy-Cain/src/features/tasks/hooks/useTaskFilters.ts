import { useState, useMemo } from 'react';
import { Task, TaskStatus } from '../types/task';

export const useTaskFilters = (tasks: Task[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.subtitle?.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.observacao?.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Sort Logic
    return result.sort((a, b) => {
      if (sortBy === 'newest') {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else if (sortBy === 'oldest') {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      } else if (sortBy === 'urgent') {
        const isAUrgent = a.observacao?.includes('[URGENTE]') ? 1 : 0;
        const isBUrgent = b.observacao?.includes('[URGENTE]') ? 1 : 0;
        if (isAUrgent !== isBUrgent) return isBUrgent - isAUrgent;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      return 0;
    });
  }, [tasks, searchQuery, statusFilter, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    filteredTasks,
  };
};

