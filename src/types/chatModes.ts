/**
 * Tipos para modos de operação do chat
 */

export enum ChatMode {
  RESPONSE_GEN = 'response_gen', // Gerador de respostas
}

export interface ChatModeConfig {
  mode: ChatMode;
  title: string;
  description: string;
  icon: string;
  placeholder: string;
  showContractSelector: boolean;
  showEmotionalAnalysis: boolean;
  enableTTS: boolean;
}

export const CHAT_MODE_CONFIGS: Record<ChatMode, ChatModeConfig> = {
  [ChatMode.RESPONSE_GEN]: {
    mode: ChatMode.RESPONSE_GEN,
    title: 'Gerador de Respostas',
    description:
      'Gera respostas humanizadas para mensagens recebidas de locadores/locatários',
    icon: '🤖',
    placeholder: 'Cole a mensagem recebida do locador/locatário...',
    showContractSelector: true,
    showEmotionalAnalysis: true,
    enableTTS: true,
  },
};
