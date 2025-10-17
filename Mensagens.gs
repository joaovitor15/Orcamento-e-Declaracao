/**
 * @fileoverview Centraliza todas as strings de texto voltadas para o usuário.
 * Estrutura:
 * 1. GERAL: Textos de uso comum.
 * 2. UI: Mensagens de estado para a interface.
 * 3. VALIDACAO: Erros de input do usuário (fora da calculadora).
 * 4. SUCESSO: Confirmações de operações bem-sucedidas (fora da calculadora).
 * 5. ERRO: Falhas de sistema ou backend.
 * 6. DIALOGO: Textos para caixas de confirmação (fora da calculadora).
 * 7. CALCULADORA: Todas as mensagens específicas da funcionalidade da calculadora.
 */

const MENSAGENS = {

  // =================================================================
  // 1. GERAL
  // =================================================================
  GERAL: {
    OPERACAO_CANCELADA: "Operação cancelada pelo usuário.",
  },

  // =================================================================
  // 2. UI (Interface do Usuário - Geral)
  // =================================================================
  UI: {
    ABRINDO_PAINEL: "Abrindo painel...",
    CARREGANDO: "Carregando...",
    BUSCANDO: "Buscando detalhes...",
    PROCESSANDO: "Processando itens...", // Mensagem genérica, mantida aqui
    SALVANDO: "Salvando...",
    GERANDO_PDF: "Gerando PDF, aguarde...",
    VOLTANDO: "Voltando ao menu...",
    ORCAMENTO_ANTERIOR_CARREGADO: "✅ Orçamento anterior carregado. Você já pode gerar o PDF.",
    NENHUM_HISTORICO: (nome) => `Nenhum histórico encontrado para '${nome}'. Comece um novo orçamento.`,
    DADOS_CARREGADOS: (nome) => `Dados de '${nome}' carregados com sucesso!`
  },

  // =================================================================
  // 3. VALIDACAO (Geral)
  // =================================================================
  VALIDACAO: {
    NOME_OBRIGATORIO: "O campo Nome é obrigatório.",
    NOME_E_VALOR_OBRIGATORIOS: "Os campos Nome e Valor são obrigatórios.",
    SELECIONE_PACIENTE_VALIDO: "Selecione uma linha de paciente válida para continuar."
  },

  // =================================================================
  // 4. SUCESSO (Geral)
  // =================================================================
  SUCESSO: {
    DOCUMENTO_GERADO: (nomeArquivo) => `Documento "${nomeArquivo}.pdf" gerado com sucesso!`
  },

  // =================================================================
  // 5. ERRO (Backend e Sistema)
  // =================================================================
  ERRO: {
    ERRO_GENERICO_SERVIDOR: (mensagem) => `Ocorreu um erro no servidor: ${mensagem}`,
    FALHA_DETALHES_PACIENTE: (linha) => `Não foi possível obter os detalhes do paciente na linha ${linha}.`,
    FALHA_PREENCHIMENTO: (linha) => `Erro na linha ${linha}: Verifique se o 'Nome' e o 'Valor' estão preenchidos corretamente.`
  },

  // =================================================================
  // 6. DIALOGO (Geral)
  // =================================================================
  DIALOGO: {
    DECLARACAO_JA_GERADA: "Esta declaração já foi gerada. Deseja gerar uma nova via?"
  },

  // =================================================================
  // 7. CALCULADORA (Todas as mensagens específicas da Calculadora)
  // =================================================================
  CALCULADORA: {
    VALIDACAO: {
      ITENS_NAO_ADICIONADOS: "É necessário adicionar pelo menos um medicamento para continuar.",
      NOME_ITEM_OBRIGATORIO: "O nome do medicamento é obrigatório para este item.",
      VALOR_ITEM_OBRIGATORIO: "O valor unitário é obrigatório para este item.",
      PACIENTE_JA_CADASTRADO: (nome) => `O paciente ${nome} já está cadastrado.`
    },
    SUCESSO: {
      ITENS_SALVOS: "Itens salvos com sucesso na calculadora!",
      ITENS_ADICIONADOS: "Itens adicionados com sucesso!"
    },
    UI: {
       AVISO_EDICAO_AVANCADA: '📝 Itens salvos! Para mais edições, utilize a aba Calculadora.'
    },
    DIALOGO: {
      CONFIRMA_VALORES_PADRAO: "Campos de 'Quantidade' ou 'Meses' em branco serão preenchidos com o valor 1.\n\nDeseja salvar mesmo assim?"
    }
  },
  // =================================================================
  // 8. TITULOS (Para caixas de diálogo e alertas)
  // =================================================================
  TITULOS: {
    VALIDACAO: "Verificação Necessária",
    CONFIRMACAO: "Confirme a Ação",
    SUCESSO: "Operação Concluída",
    ERRO: "Ocorreu um Erro",
    AVISO: "Atenção"
  },

  
};