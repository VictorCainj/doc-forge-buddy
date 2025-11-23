import { Task, TaskStatus } from '../types/task';
import { TaskBlock } from './TaskBlock';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTaskDragAndDrop } from '../hooks/useTaskDragAndDrop';
import { TaskHighlightSection } from './TaskHighlightSection';

interface TaskBoardViewProps {
  tasks: {
    not_started: Task[];
    in_progress: Task[];
    completed: Task[];
  };
  highlightedTask: Task | null;
  urgentTask: Task | null;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onRequestCompletion: (task: Task) => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
  }) => Promise<void>;
  onTaskClick: (task: Task) => void;
}

export const TaskBoardView = ({
  tasks,
  highlightedTask,
  urgentTask,
  onEdit,
  onDelete,
  onChangeStatus,
  onRequestCompletion,
  onCreateTask,
  onTaskClick,
}: TaskBoardViewProps) => {
  const { onDragEnd } = useTaskDragAndDrop();

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <TaskHighlightSection
        highlightedTask={highlightedTask}
        urgentTask={urgentTask}
        onEdit={onEdit}
        onDelete={onDelete}
        onChangeStatus={onChangeStatus}
        onRequestCompletion={onRequestCompletion}
        onTaskClick={onTaskClick}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TaskBlock
          status="not_started"
          tasks={tasks.not_started}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangeStatus={onChangeStatus}
          onRequestCompletion={onRequestCompletion}
          onCreateTask={onCreateTask}
          onTaskClick={onTaskClick}
        />
        <TaskBlock
          status="in_progress"
          tasks={tasks.in_progress}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangeStatus={onChangeStatus}
          onRequestCompletion={onRequestCompletion}
          onCreateTask={onCreateTask}
          onTaskClick={onTaskClick}
        />
        <TaskBlock
          status="completed"
          tasks={tasks.completed}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangeStatus={onChangeStatus}
          onRequestCompletion={onRequestCompletion}
          onCreateTask={onCreateTask}
          onTaskClick={onTaskClick}
        />
      </div>
    </DragDropContext>
  );
};

