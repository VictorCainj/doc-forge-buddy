import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey:
    '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',
  dangerouslyAllowBrowser: true, // Apenas para desenvolvimento
});

export const correctTextWithAI = async (text: string): Promise<string> => {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente especializado em correção de texto em português brasileiro. 
          
          Suas tarefas são:
          1. Corrigir erros de gramática, ortografia e pontuação
          2. Melhorar a clareza e fluidez do texto
          3. Manter o tom e estilo original do autor
          4. Preservar a estrutura e formatação do texto
          5. Não alterar o significado ou conteúdo principal
          
          Responda APENAS com o texto corrigido, sem explicações adicionais.`,
        },
        {
          role: 'user',
          content: `Por favor, corrija o seguinte texto em português brasileiro:\n\n${text}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const correctedText = completion.choices[0]?.message?.content;

    if (!correctedText) {
      throw new Error('Resposta vazia da API');
    }

    return correctedText.trim();
  } catch (error) {
    console.error('Erro na API da OpenAI:', error);
    throw new Error('Erro ao corrigir o texto. Tente novamente.');
  }
};
