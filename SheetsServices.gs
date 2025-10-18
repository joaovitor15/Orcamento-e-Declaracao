/**
 * Converte uma string de moeda formatada (ex: "1.234,56") em um número.
 * @param {string} valorString A string de moeda.
 * @return {number} O valor numérico.
 */
function _parseMoeda(valorString) {
  if (!valorString || typeof valorString !== 'string') return 0;
  // Remove os pontos de milhar e substitui a vírgula decimal por um ponto.
  const valorLimpo = valorString.replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(valorLimpo);
  return isNaN(numero) ? 0 : numero;
}

function getPacientes() {
  return _obterListaDeEntidades(CONFIG.PLANILHA.ABAS.GERACAO);
}

function getDetalhesPaciente(linha) {
  try {
    const COL = CONFIG.PLANILHA.COLUNAS.GERACAO;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.GERACAO);
    const rangeWidth = COL.STATUS - COL.CPF + 1;
    const values = sheet.getRange(linha, COL.CPF, 1, rangeWidth).getDisplayValues()[0];
    const cpf = values[COL.CPF - COL.CPF];
    const status = values[COL.STATUS - COL.CPF];
    return { cpf: formatarCPF(cpf), status: status };
  } catch (e) {
    // ALTERADO: Usando o objeto MENSAGENS
    throw new Error(MENSAGENS.ERRO.FALHA_DETALHES_PACIENTE(linha));
  }
}

function adicionarNovoPaciente(nome, cpf) {
  try {
    if (!nome) {
      // Validação para o campo nome
      throw new Error(MENSAGENS.VALIDACAO.NOME_OBRIGATORIO);
    }

    // Pega o nome da aba a partir da configuração
    const nomeDaAba = CONFIG.PLANILHA.ABAS.GERACAO;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeDaAba);

    // Verifica se a aba realmente existe
    if (!sheet) {
      throw new Error(`A aba "${nomeDaAba}" não foi encontrada. Verifique o nome da aba na planilha.`);
    }

    // Adiciona uma nova linha com os dados do paciente
    sheet.appendRow([nome, formatarCPF(cpf)]);
    const novaLinha = sheet.getLastRow();
    
    // Log para depuração (visível em "Execuções" no Apps Script)
    Logger.log(`Paciente "${nome}" adicionado com sucesso na linha ${novaLinha}.`);
    return { nome: nome, linha: novaLinha }; // Retorna os dados em caso de sucesso

  } catch (e) {
    // Captura QUALQUER erro que acontecer no bloco 'try'
    Logger.log(`Erro em adicionarNovoPaciente: ${e.message}\n${e.stack}`);
    // Lança um novo erro que será enviado para o modal
    throw new Error(`Falha ao salvar: ${e.message}`);
  }
}
function carregarHistoricoParaCalculadora(linha) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abaGeracao = ss.getSheetByName(CONFIG.PLANILHA.ABAS.GERACAO);
  const nomePaciente = abaGeracao.getRange(linha, 1).getValue();
  const abaCalculadora = ss.getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);

  if (abaCalculadora.getLastRow() > 1) {
    abaCalculadora.getRange(2, 1, abaCalculadora.getLastRow() - 1, abaCalculadora.getLastColumn()).clearContent();
  }

  const abaHistorico = ss.getSheetByName(CONFIG.PLANILHA.ABAS.HISTORICO);
  const todosHistoricos = abaHistorico.getDataRange().getValues();
  const historicoFiltrado = todosHistoricos.filter(row => row[0] === nomePaciente);
  if (historicoFiltrado.length === 0) {
    // ALTERADO: Usando o objeto MENSAGENS
    return { success: false, message: MENSAGENS.UI.NENHUM_HISTORICO(nomePaciente) };
  }

  let dataMaisRecente = new Date(0);
  historicoFiltrado.forEach(row => { const dataRegistro = new Date(row[7]); if (dataRegistro > dataMaisRecente) dataMaisRecente = dataRegistro; });
  const ultimoHistorico = historicoFiltrado.filter(row => new Date(row[7]).getTime() === dataMaisRecente.getTime());
  const valoresParaCalculadora = ultimoHistorico.map(row => [row[2], row[3], row[4], row[5], row[6]]);
  if (valoresParaCalculadora.length > 0) {
    abaCalculadora.getRange(2, 1, valoresParaCalculadora.length, valoresParaCalculadora[0].length).setValues(valoresParaCalculadora);
    // ALTERADO: Usando o objeto MENSAGENS
    return { success: true, message: MENSAGENS.UI.DADOS_CARREGADOS(nomePaciente) };
  }
  return { success: false, message: `Não foi possível carregar.` };
  // Mantido como fallback
}

function salvarDadosCalculadora(itens) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);
  if (aba.getLastRow() > 1) {
    aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).clearContent();
  }
  const dados = itens.map(it => [it.nome, it.principio, _parseMoeda(it.valor), it.qtd, it.duracao]);
  if (dados.length > 0) {
    const range = aba.getRange(2, 1, dados.length, dados[0].length);
    range.setValues(dados);
    range.offset(0, 2, dados.length, 1).setNumberFormat('R$ #,##0.00');
  }
  return MENSAGENS.CALCULADORA.SUCESSO.ITENS_SALVOS;
}

function appendDadosCalculadora(itens) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);
  const ultimaLinha = aba.getLastRow();
  const dados = itens.map(it => [it.nome, it.principio, _parseMoeda(it.valor), it.qtd, it.duracao]);
  if (dados.length > 0) {
    const range = aba.getRange(ultimaLinha + 1, 1, dados.length, dados[0].length);
    range.setValues(dados);
    range.offset(0, 2, dados.length, 1).setNumberFormat('R$ #,##0.00');
  }
  return MENSAGENS.CALCULADORA.SUCESSO.ITENS_ADICIONADOS;
}

function getDetalhesPacienteDeclaracao(linha) {
  try {
    const COL = CONFIG.PLANILHA.COLUNAS.DECLARACAO;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.DECLARACAO);
    const rangeWidth = COL.STATUS - COL.CPF + 1;
    
    // Usar getDisplayValues() já nos dá o texto formatado (ex: "R$ 154,00").
    const values = sheet.getRange(linha, COL.CPF, 1, rangeWidth).getDisplayValues()[0];
    
    const cpf = values[COL.CPF - COL.CPF];
    const valor = values[COL.VALOR - COL.CPF]; // A variável 'valor' agora contém "R$ 154,00"
    const status = values[COL.STATUS - COL.CPF];

    // CORREÇÃO: Removemos a tentativa de re-formatar o valor.
    // Simplesmente retornamos o valor que já foi lido da planilha.
    return { cpf: formatarCPF(cpf), valor: valor, status };

  } catch (e) {
    throw new Error(MENSAGENS.ERRO.FALHA_DETALHES_PACIENTE(linha));
  }
}

// Versão antiga em SheetsServices.gs
function adicionarNovoPacienteDeclaracao(nome, cpf, valor) {
  if (!nome || !valor) throw new Error(MENSAGENS.VALIDACAO.NOME_E_VALOR_OBRIGATORIOS);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.DECLARACAO);
  
  // CORRIGIDO: Agora usa a função _parseMoeda para salvar como um número verdadeiro.
  sheet.appendRow([nome, formatarCPF(cpf), _parseMoeda(valor)]);
  
  // Formata a célula recém-adicionada para o padrão de moeda.
  const novaLinha = sheet.getLastRow();
  sheet.getRange(novaLinha, CONFIG.PLANILHA.COLUNAS.DECLARACAO.VALOR).setNumberFormat('R$ #,##0.00');

  return { nome: nome, linha: novaLinha };
}
function limparCalculadoraSilenciosamente() {
  try {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);
    if (aba.getLastRow() > 1) {
      aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).clearContent();
    }
  } catch (e) {
    Logger.log("Falha ao limpar calculadora: " + e.message);
  }
}

function _obterListaDeEntidades(nomeDaAba) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeDaAba);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  return values
    .map((row, index) => ({ nome: row[0], linha: index + 2 }))
    .filter(item => item.nome);
}

function _atualizarHistorico(abaHistorico, nomePaciente, cpfPaciente, dataAtual, medsParaHistorico) {
  const todosOsDados = abaHistorico.getDataRange().getValues();
  const cabecalho = todosOsDados.shift() || [];
  const historicoMap = new Map();

  todosOsDados.forEach(row => {
    const chave = `${row[0]}|${row[2]}`; // ex: "Maria Silva|Paracetamol"
    historicoMap.set(chave, row);
  });
  // 2. Adiciona ou ATUALIZA o mapa com os novos medicamentos do orçamento atual.
  // Se a chave já existir, o valor antigo é simplesmente substituído pelo novo.
  medsParaHistorico.forEach(med => {
    // med vem de DocumentBuilder.gs e é um array como [medNome, pAtivo, valor, qtd, duracao]
    const chave = `${nomePaciente}|${med[0]}`;
    const novaLinha = [nomePaciente, cpfPaciente, med[0], med[1], med[2], med[3], med[4], dataAtual];
    historicoMap.set(chave, novaLinha);
  });
  const historicoFinal = Array.from(historicoMap.values());

  // 4. Limpa a aba e reescreve os dados atualizados de uma só vez (muito mais rápido).
  abaHistorico.clearContents();
  if (cabecalho.length > 0) {
    abaHistorico.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  }
  if (historicoFinal.length > 0) {
    abaHistorico.getRange(2, 1, historicoFinal.length, historicoFinal[0].length).setValues(historicoFinal);
  }
}
function getPacientesDeclaracao() {
  return _obterListaDeEntidades(CONFIG.PLANILHA.ABAS.DECLARACAO);
}