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
      <CardContent className="p-2.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          {/* Nível e Progresso */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-neutral-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold text-neutral-900">
                    Nível {level}
                  </h3>
                  <span className="text-[10px] text-neutral-500">•</span>
                  <span className="text-[10px] text-neutral-600">{title}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Progress value={progress} className="h-1 w-24" />
                  <span className="text-[10px] text-neutral-500">
                    {currentLevelExp}/{nextLevelExp} EXP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas Compactas */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-neutral-50 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500">Total EXP</p>
                <p className="text-xs font-semibold text-neutral-900">{exp}</p>
              </div>
            </div>

            <div className="h-6 w-px bg-neutral-200" />

            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-neutral-50 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500">Concluídas</p>
                <p className="text-xs font-semibold text-neutral-900">
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
