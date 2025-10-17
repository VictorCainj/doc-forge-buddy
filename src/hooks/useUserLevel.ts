import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getLevelInfo, getExpProgress, USER_LEVELS } from '@/types/task';

export const useUserLevel = () => {
  const { user } = useAuth();

  const {
    data: userStats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userLevel', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('exp, level')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar nível do usuário:', error);
        throw error;
      }

      return {
        exp: data?.exp || 0,
        level: data?.level || 1,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const currentExp = userStats?.exp || 0;
  const currentLevel = userStats?.level || 1;
  const levelInfo = getLevelInfo(currentLevel);
  const expProgress = getExpProgress(currentExp);

  return {
    exp: currentExp,
    level: currentLevel,
    title: levelInfo.title,
    icon: levelInfo.icon,
    color: levelInfo.color,
    levelInfo,
    progress: expProgress.progress,
    currentLevelExp: expProgress.currentLevelExp,
    nextLevelExp: expProgress.nextLevelExp,
    allLevels: USER_LEVELS,
    isLoading,
    error,
    refetch,
  };
};
