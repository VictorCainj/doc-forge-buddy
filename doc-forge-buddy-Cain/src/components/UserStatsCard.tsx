import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useTasks } from '@/hooks/useTasks';
import { CheckCircle2, TrendingUp } from '@/utils/iconMapper';

export const UserStatsCard = () => {
  const { exp, level, title, progress, currentLevelExp, nextLevelExp } =
    useUserLevel();

  const { tasks } = useTasks();
  const completedTasks = tasks.filter(
    (task) => task.status === 'completed'
  ).length;

  return (
    <Card className="border-neutral-200">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Nível e Progresso */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-neutral-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Nível {level}
                  </h3>
                  <span className="text-xs text-neutral-500">•</span>
                  <span className="text-xs text-neutral-600">{title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progress} className="h-1.5 w-32" />
                  <span className="text-xs text-neutral-500">
                    {currentLevelExp}/{nextLevelExp} EXP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas Compactas */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-neutral-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Total EXP</p>
                <p className="text-sm font-semibold text-neutral-900">{exp}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-neutral-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-neutral-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-neutral-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Concluídas</p>
                <p className="text-sm font-semibold text-neutral-900">
                  {completedTasks}/{tasks.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
