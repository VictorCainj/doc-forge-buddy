import { memo, useEffect, useState } from 'react';
import { Clock, MessageSquare, Trash2, Loader2 } from '@/utils/iconMapper';
import { Button } from '@/components/ui/button';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSession {
  id: string;
  title: string;
  mode: string;
  created_at: string | null;
  updated_at: string | null;
  metadata?: Record<string, unknown>;
}

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

const ChatHistory = memo(({ onSelectSession, currentSessionId }: ChatHistoryProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadSessions, deleteSession } = useChatPersistence();

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions as ChatSession[]);
      setLoading(false);
    };
    
    fetchSessions();
  }, [loadSessions]);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const success = await deleteSession(sessionId);
    if (success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageSquare className="h-12 w-12 text-neutral-400 mb-4" />
        <p className="text-sm text-neutral-700">
          Nenhuma conversa salva ainda
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Suas conversas salvas aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-2 p-4">
        <AnimatePresence>
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                  currentSessionId === session.id
                    ? 'bg-neutral-100 border border-neutral-300'
                    : 'bg-white hover:bg-neutral-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 truncate mb-1">
                      {session.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {session.updated_at ? formatDistanceToNow(new Date(session.updated_at), {
                          addSuffix: true,
                          locale: ptBR,
                        }) : 'Data desconhecida'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(session.id, e)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

ChatHistory.displayName = 'ChatHistory';

export default ChatHistory;
