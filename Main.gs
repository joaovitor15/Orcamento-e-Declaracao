function onOpen() {
  SpreadsheetApp.getUi().createMenu('Painel Principal')
    .addItem('Abrir Painel', 'mostrarMenuPrincipal')
    .addToUi();
    

  try {
    const calcSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);
    if (calcSheet) calcSheet.getRange("C2:C").setNumberFormat('R$ #,##0.00');
  } catch (e) { 
    Logger.log("Falha ao formatar coluna C da Calculadora: " + e.message); 
  }
}

function mostrarMenuPrincipal() {
  const html = HtmlService.createTemplateFromFile('MenuPrincipal').evaluate().setTitle('Painel Principal').setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function mostrarSidebarOrcamento() {
  // CORRETO: Garante que o nome corresponde ao arquivo "SidebarOrçamento.html"
  const html = HtmlService.createTemplateFromFile('SidebarOrçamento').evaluate().setTitle('Painel de Orçamento').setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function mostrarSidebarDeclaracao() {
    const html = HtmlService.createTemplateFromFile('SidebarDeclacao').evaluate().setTitle('Painel de Declaração').setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}
/**
 * Retorna uma string JSON contendo as variáveis CONFIG.STATUS e MENSAGENS.
 * Usada para injetar dados do servidor no template HTML (evita falhas de renderização).
 */
function getDadosParaCliente() {
  // A variável CONFIG.STATUS e MENSAGENS são globais e devem estar corretas no backend.
  return JSON.stringify({ 
    mensagens: MENSAGENS, 
    status: CONFIG.STATUS,
  });
}
// --- Funções Comuns e de Alerta ---
// CÓDIGO CORRIGIDO
function mostrarDialogoConfirmacao(itens, nomeDaFuncaoSalvar) { 
  const ui = SpreadsheetApp.getUi();
  const mensagem = MENSAGENS.CALCULADORA.DIALOGO.CONFIRMA_VALORES_PADRAO;
  const resposta = ui.alert('Atenção', mensagem, ui.ButtonSet.OK_CANCEL);
  
   if (resposta == ui.Button.OK) {
   if (nomeDaFuncaoSalvar === 'salvarDadosCalculadora') return salvarDadosCalculadora(itens);
   if (nomeDaFuncaoSalvar === 'appendDadosCalculadora') return appendDadosCalculadora(itens);
  }
  // CORREÇÃO: Agora usa a mensagem da categoria GERAL.
  return { status: 'cancelado', message: MENSAGENS.GERAL.OPERACAO_CANCELADA };
}

function mostrarAlerta(mensagem, titulo) {
  SpreadsheetApp.getUi().alert(titulo || 'Aviso', mensagem, SpreadsheetApp.getUi().ButtonSet.OK);
}

//==============================================================
// --- FLUXO PRINCIPAL DE GERAÇÃO DE DOCUMENTOS ---
//==============================================================
function gerarOrcamentoFinal(linhaSelecionada) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaGeracao = ss.getSheetByName(CONFIG.PLANILHA.ABAS.GERACAO);
    const nomePaciente = abaGeracao.getRange(linhaSelecionada, 1).getDisplayValue();
    if (!nomePaciente) throw new Error(MENSAGENS.VALIDACAO.SELECIONE_PACIENTE_VALIDO);

    // --- NOVA VALIDAÇÃO ---
    // Verificamos a calculadora ANTES de tentar criar o documento.
    const abaCalculadora = ss.getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);
    const dadosMedicamentos = abaCalculadora.getDataRange().getValues();
    if (dadosMedicamentos.length <= 1 || !dadosMedicamentos.slice(1).some(row => row[0])) {
      // Se estiver vazia, retorna um objeto especial para a interface.
      return { status: 'CALCULADORA_VAZIA', message: MENSAGENS.CALCULADORA.VALIDACAO.ITENS_NAO_ADICIONADOS };
    }
    // --- FIM DA NOVA VALIDAÇÃO ---

    // Se a validação passar, o código continua normalmente.
    const pasta = DriveApp.getFolderById(CONFIG.DRIVE.ID_DA_PASTA_IMPRESSOS);
    const resultadoDoc = criarDocumentoBaseOrcamento(ss, linhaSelecionada);
    if (!resultadoDoc) return; // Segurança extra

    const { doc, cpfPaciente, dataAtual } = resultadoDoc;
    const nomeArquivo = _gerarNomeArquivo(CONFIG.FORMATO_NOMES_FICHEIROS.ORCAMENTO, nomePaciente, dataAtual);
    const pdfUrl = _salvarComoPdf(pasta, doc, nomeArquivo);

    const abaHistorico = ss.getSheetByName(CONFIG.PLANILHA.ABAS.HISTORICO);
    const medsParaHistorico = dadosMedicamentos.slice(1).filter(row => row[0]);
    if (medsParaHistorico.length > 0) {
      _atualizarHistorico(abaHistorico, nomePaciente, cpfPaciente, dataAtual, medsParaHistorico);
    }
    
    const COL = CONFIG.PLANILHA.COLUNAS.GERACAO;
    abaGeracao.getRange(linhaSelecionada, COL.DATA, 1, 3).setValues([[dataAtual.toLocaleDateString('pt-BR'), CONFIG.STATUS.GERADO, pdfUrl]]);
    return { message: MENSAGENS.SUCESSO.DOCUMENTO_GERADO(nomeArquivo), pdfUrl: pdfUrl };
    
  } catch (e) {
    Logger.log("Erro em gerarOrcamentoFinal: " + e.message + "\n" + e.stack);
    throw new Error(e.message);
  }
}
function verificarStatusDeclaracao(linha) {
  try {
    const abaDeclaracao = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.DECLARACAO);
    const nomePacienteCheck = abaDeclaracao.getRange(linha, 1).getDisplayValue();
    if (!nomePacienteCheck) return 'INVALIDO'; // Retorna um status se o paciente não for encontrado
    
    return abaDeclaracao.getRange(linha, CONFIG.PLANILHA.COLUNAS.DECLARACAO.STATUS).getDisplayValue();
  } catch(e) {
    throw new Error('Não foi possível verificar o status da declaração.');
  }
}


/**
 * NOVA FUNÇÃO: Apenas verifica o status de uma declaração e o retorna para o cliente.
 */
function verificarStatusDeclaracao(linha) {
  try {
    const abaDeclaracao = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.DECLARACAO);
    const nomePacienteCheck = abaDeclaracao.getRange(linha, 1).getDisplayValue();
    if (!nomePacienteCheck) return 'INVALIDO'; // Retorna um status se o paciente não for encontrado
    
    return abaDeclaracao.getRange(linha, CONFIG.PLANILHA.COLUNAS.DECLARACAO.STATUS).getDisplayValue();
  } catch(e) {
    throw new Error('Não foi possível verificar o status da declaração.');
  }
}


/**
 * FUNÇÃO ATUALIZADA: Agora chamada 'forcarGerarDeclaracaoGasto', ela gera o PDF sem fazer perguntas.
 */
function forcarGerarDeclaracaoGasto(linha) {
   try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pasta = DriveApp.getFolderById(CONFIG.DRIVE.ID_DA_PASTA_IMPRESSOS);
    const abaDeclaracao = ss.getSheetByName(CONFIG.PLANILHA.ABAS.DECLARACAO);
    
    const resultadoDoc = criarDocumentoBaseDeclaracao(ss, linha);
    if (!resultadoDoc) return;
    const { doc, nomePaciente, dataAtual } = resultadoDoc;

    const nomeArquivo = _gerarNomeArquivo(CONFIG.FORMATO_NOMES_FICHEIROS.DECLARACAO, nomePaciente, dataAtual);
    const pdfUrl = _salvarComoPdf(pasta, doc, nomeArquivo);
    
    const COL = CONFIG.PLANILHA.COLUNAS.DECLARACAO;
    abaDeclaracao.getRange(linha, COL.DATA, 1, 3).setValues([[dataAtual.toLocaleDateString('pt-BR'), CONFIG.STATUS.GERADO, pdfUrl]]);
    
    return { message: MENSAGENS.SUCESSO.DOCUMENTO_GERADO(nomeArquivo), pdfUrl: pdfUrl };

   } catch (e) {
    Logger.log("Erro em forcarGerarDeclaracaoGasto: " + e.message + "\n" + e.stack);
    throw new Error(e.message);
   }
}