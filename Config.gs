const CONFIG = {
  DRIVE: {
    ID_DA_PASTA_IMPRESSOS: "1wuAjmWN1DrY3BHkxvY0IcwYzRsBkH-OZ",
    ID_DA_IMAGEM_ASSINATURA: "1dX18yhWOoERmJ-VBAC_iWCaJR08839PD"
  },
  
  PLANILHA: {
    ABAS: {
      GERACAO: "Geração",
      CALCULADORA: "Calculadora",
      HISTORICO: "Historico Medicação",
      DECLARACAO: "Declaração de Gasto",
    }, 
    
    COLUNAS: {
      GERACAO: { 
        NOME: 1, 
        CPF: 2, 
        DATA: 3, 
        STATUS: 4, 
        LINK: 5,
      },
      DECLARACAO: { 
        NOME: 1, 
        CPF: 2, 
        VALOR: 3, 
        DATA: 4, 
        STATUS: 5, 
        LINK: 6,
      },
      
      CALCULADORA: {
          NOME: 1,
          PRINCIPIO: 2,
          VALOR_UNITARIO: 3,
          QTD_POR_MES: 4,
          DURACAO_MESES: 5,
      }
    }
  }, 

  STATUS: {
    GERADO: "GERADO",
    PENDENTE: "PENDENTE",
    ARQUIVADO: "Gerado e Arquivado" 
  },

  FORMATO_NOMES_FICHEIROS: {
    ORCAMENTO: "{{NOME}} - {{DD}}-{{MM}}",
    DECLARACAO: "Declaração - {{NOME}} - {{DD}}-{{MM}}"
  },
  
  DOCUMENTO: {
    LARGURA_IMAGEM_ASSINATURA: 130,
    ALTURA_IMAGEM_ASSINATURA: 65,
    MARGENS: { superior: 35, inferior: 35, esquerda: 72, direita: 72 },
    
    ALINHAMENTO: { 
        ESQUERDA: "LEFT", 
        CENTRO: "CENTER", 
        DIREITA: "RIGHT", 
        JUSTIFICADO: "JUSTIFY" 
    },
    
    ESTILOS: {
      titulo: { fonte: "Arial", tamanho: 18, negrito: true, alinhamento: DocumentApp.HorizontalAlignment.CENTER, espacamentoDepois: 9 },
      subtitulo: { fonte: "Arial", tamanho: 15, negrito: true, alinhamento: DocumentApp.HorizontalAlignment.CENTER, espacamentoAntes: 2, espacamentoDepois: 9 },
      textoNormal: { fonte: "Arial", tamanho: 11, negrito: false, alinhamento: DocumentApp.HorizontalAlignment.JUSTIFY, espacamentoDepois: 5 },
      rodape: { fonte: "Arial", tamanho: 10, negrito: false, alinhamento: DocumentApp.HorizontalAlignment.CENTER }
    },
    
    TEXTOS: {
      estabelecimento: { titulo: "1. Estabelecimento", texto: "Nome Fantasia: Agafarma Tuparendi. Razão Social: Luiz Moacir Machry. CNPJ: 89.055.768/0001-76. Inscrição Estadual (IE): 1520012834. Endereço: Avenida Mauá, 1761 - Tuparendi/RS" },
      paciente: { titulo: "2. Dados do Paciente", nome: "Nome:", cpf: "CPF:" },
      assinatura: { cidade: "Tuparendi", linha: "_____________________________", nomeFarmacia: "FARMACIA AGAFARMA TUPARENDI" },
      rodape: { texto: "Avenida Mauá, 1761, Centro, Tuparendi-RS, CEP 98940-000 Fone: (55) 3543-1432" },
      orcamento: {
        tituloPrincipal: "Orçamento de Medicamentos",
        medicamentos: { titulo: "3. Medicamentos", quantidade: "quantidade:", porMes: "por mês", valorUnitario: "valor unitário:", custoMensal: "custo mensal:", custoTratamento: "custo para" },
        totais: { titulo: "4. Total do Orçamento", totalMensal: "Valor total do orçamento mensal:", totalTratamentoVariavel: "Valor total do orçamento para o tratamento completo:", totalTratamentoFixo: "Valor total para" }
      },
      declaracao: {
        titulo: "Declaração de Gasto",
        descricao: { titulo: "3. Descrição", corpo: "Declaramos para os devidos fins que o(a) Sr(a). {{NOME}}, portador(a) do CPF de número {{CPF}}, possui em nosso sistema um débito em aberto no valor de {{VALOR}}, referente à aquisição de medicamentos." }
      }
    }
  }
};