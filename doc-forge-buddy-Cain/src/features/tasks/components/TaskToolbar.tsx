import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, LayoutGrid, List, Plus, Sparkles, Filter, ArrowUpDown } from 'lucide-react';

interface TaskToolbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'board' | 'list';
  setViewMode: (mode: 'board' | 'list') => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onNewTask: () => void;
  onAITask: () => void;
}

export function TaskToolbar({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  onNewTask,
  onAITask,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white border-neutral-200 focus:border-primary-500 focus:ring-primary-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={onAITask}
            variant="outline"
            className="flex-1 sm:flex-none gap-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 hover:border-purple-300 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Criar com IA</span>
            <span className="sm:hidden">IA</span>
          </Button>
          <Button
            onClick={onNewTask}
            className="flex-1 sm:flex-none gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="flex items-center gap-2 pr-2 border-r border-neutral-200">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9 border-none bg-transparent hover:bg-neutral-50 focus:ring-0">
                <Filter className="h-4 w-4 mr-2 text-neutral-500" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="not_started">A Fazer</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] h-9 border-none bg-transparent hover:bg-neutral-50 focus:ring-0">
                <ArrowUpDown className="h-4 w-4 mr-2 text-neutral-500" />
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais Recentes</SelectItem>
                <SelectItem value="oldest">Mais Antigas</SelectItem>
                <SelectItem value="urgent">Prioridade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center bg-neutral-100 p-1 rounded-md">
          <button
            onClick={() => setViewMode('board')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'board'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            title="Visualização em Quadro"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            title="Visualização em Lista"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

