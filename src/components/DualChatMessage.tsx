/**
 * Componente para renderizar mensagens do chat dual
 */

import { memo } from 'react';
import { DualMessage } from '@/types/dualChat';
import ChatMessage from '@/components/ChatMessage';
import { motion } from 'framer-motion';

interface DualChatMessageProps {
  message: DualMessage;
  side: 'locador' | 'locatario';
  showGreeting: boolean;
}

const DualChatMessage = memo(
  ({ message, side, showGreeting }: DualChatMessageProps) => {
    const responseMessage =
      side === 'locador' ? message.locadorResponse : message.locatarioResponse;

    const sideConfig = {
      locador: {
        title: 'Locador',
        bgColor: 'bg-white',
        borderColor: 'border-neutral-200',
        textColor: 'text-neutral-900',
        icon: '🏠',
      },
      locatario: {
        title: 'Locatário',
        bgColor: 'bg-white',
        borderColor: 'border-neutral-200',
        textColor: 'text-neutral-900',
        icon: '👤',
      },
    };

    const config = sideConfig[side];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-4 ${config.bgColor} ${config.borderColor} border rounded-lg p-4`}
      >
        {/* Header da mensagem */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{config.icon}</span>
          <h3 className={`font-semibold ${config.textColor}`}>
            {config.title}
          </h3>
          <span className="text-xs text-neutral-500">
            {message.timestamp.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Mensagem original (se for do lado que enviou) */}
        {message.detectedSender === side && (
          <div className="mb-3 p-3 bg-white rounded border-l-4 border-neutral-300">
            <div className="text-sm text-neutral-600 mb-1">
              Mensagem original:
            </div>
            <div className="text-sm">{message.originalMessage}</div>
          </div>
        )}

        {/* Resposta gerada */}
        <div className="space-y-2">
          <div className="text-sm text-neutral-600 mb-1">Resposta gerada:</div>
          <ChatMessage
            message={responseMessage}
            onRetry={() => {}} // Implementar retry se necessário
            onCopy={() => {}} // Implementar copy se necessário
            showAnalysis={false}
          />
        </div>

        {/* Indicador de detecção */}
        {message.detectedSender === side && (
          <div className="mt-2 text-xs text-neutral-500 italic">
            ✓ Detectado como {side}
          </div>
        )}
      </motion.div>
    );
  }
);

DualChatMessage.displayName = 'DualChatMessage';

export default DualChatMessage;
