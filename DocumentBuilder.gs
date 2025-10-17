function criarDocumentoBaseOrcamento(ss, linha) {
  const abaGeracao = ss.getSheetByName(CONFIG.PLANILHA.ABAS.GERACAO);
  const abaCalculadora = ss.getSheetByName(CONFIG.PLANILHA.ABAS.CALCULADORA);

  const [nome, cpf] = abaGeracao.getRange(linha, 1, 1, 2).getDisplayValues()[0];
  const dadosMedicamentos = abaCalculadora.getDataRange().getValues();
  
  const tempName = "temp_orc_" + Date.now();
  const doc = DocumentApp.create(tempName);
  const corpo = doc.getBody();
  _formatarCorpoDocumento(corpo);
  
  const { eS, eN } = _obterEstilosFormatados();
  const { paciente, orcamento } = CONFIG.DOCUMENTO.TEXTOS;

  _adicionarCabecalhoPadrao(corpo, { eS, eN });
  corpo.appendParagraph(paciente.titulo).setAttributes(eS);
  if (nome) corpo.appendParagraph(`${paciente.nome} ${nome}`).setAttributes(eN);
  if (cpf) corpo.appendParagraph(`${paciente.cpf} ${cpf}`).setAttributes(eN);

  corpo.appendParagraph(orcamento.medicamentos.titulo).setAttributes(eS);
  
  let totalMensal = 0, totalTratamento = 0, pDur = -1, durIguais = true;
  let contador = 0;

  
  for (let i = 1; i < dadosMedicamentos.length; i++) {
    const med = dadosMedicamentos[i];
    if (med[0]) {
        contador++;
        const [medNome, pAtivo, valorStr, qtdStr, duracaoStr] = med;
        
        const valorUnit = parseFloat(String(valorStr || '0').replace("R$", "").trim().replace(/\./g, "").replace(",", ".")); 
        const qtd = parseInt(qtdStr || '1');
        const duracao = parseInt(duracaoStr || '1');
        
        const custoMensal = valorUnit * qtd;
        totalMensal += custoMensal;
        const custoTotal = custoMensal * duracao;
        totalTratamento += custoTotal;
        
        if (pDur === -1) pDur = duracao;
        else if (pDur !== duracao) durIguais = false;
        
        // ================== NOVA LÓGICA AUTOMÁTICA ==================
        // 1. O script determina a unidade base a partir do nome do medicamento.
        const unidadeBase = _determinarUnidadePeloNome(medNome);
        
        // 2. O script aplica o plural se a quantidade for maior que 1.
        const unidadePlural = unidadeBase + (qtd > 1 ? 's' : ''); 
        
        // 3. O texto é montado dinamicamente, buscando os textos padrão do seu CONFIG.
        const textoQuantidade = `${orcamento.medicamentos.quantidade} ${qtd} ${unidadePlural} ${orcamento.medicamentos.porMes}`;
       
        let linhaTexto = `${contador}. ${medNome}${pAtivo ? ` (${pAtivo})` : ''}, ${textoQuantidade}, ${orcamento.medicamentos.valorUnitario} ${formatarMoeda(valorUnit)}, ${orcamento.medicamentos.custoMensal} ${formatarMoeda(custoMensal)}`;
        if (duracao > 1) {
            linhaTexto += `, ${orcamento.medicamentos.custoTratamento} ${duracao} meses: ${formatarMoeda(custoTotal)}`;
        }
        corpo.appendParagraph(linhaTexto).setAttributes(eN);
      }
}

  corpo.appendParagraph(orcamento.totais.titulo).setAttributes(eS);
  corpo.appendParagraph(`${orcamento.totais.totalMensal} ${formatarMoeda(totalMensal)}`).setAttributes(eN);

  if (totalTratamento > totalMensal) {
    let textoFinal = durIguais ? `${orcamento.totais.totalTratamentoFixo} ${pDur} ${(pDur > 1 ? "meses" : "mês")} de tratamento: ${formatarMoeda(totalTratamento)}` : `${orcamento.totais.totalTratamentoVariavel} ${formatarMoeda(totalTratamento)}`;
    corpo.appendParagraph(textoFinal).setAttributes(eN);
  }

  const dataAtual = new Date();
  _adicionarAssinaturaERodape(corpo, dataAtual, { eN });
  doc.saveAndClose();
  return { doc, nomePaciente: nome, cpfPaciente: cpf, dataAtual, dadosMedicamentos };
}

function criarDocumentoBaseDeclaracao(ss, linha) {
  const aba = ss.getSheetByName(CONFIG.PLANILHA.ABAS.DECLARACAO);
  const [nome, cpf, valorStr] = aba.getRange(linha, 1, 1, 3).getDisplayValues()[0];
  
  const valorAberto = parseFloat(String(valorStr || '0').replace("R$", "").trim().replace(/\./g, "").replace(",", "."));

 if (!nome || !(valorAberto > 0)) {
    throw new Error(MENSAGENS.ERRO.FALHA_PREENCHIMENTO(linha));
  }
  
  const tempName = "temp_dec_" + Date.now();
  const doc = DocumentApp.create(tempName);
  const corpo = doc.getBody();
  _formatarCorpoDocumento(corpo);
  
  const { eT, eS, eN } = _obterEstilosFormatados();
  const { paciente, declaracao } = CONFIG.DOCUMENTO.TEXTOS;

  corpo.appendParagraph(declaracao.titulo).setAttributes(eT);
  _adicionarCabecalhoPadrao(corpo, { eS, eN });
  
  corpo.appendParagraph(paciente.titulo).setAttributes(eS);
  corpo.appendParagraph(`${paciente.nome} ${nome}`).setAttributes(eN);
  if (cpf) corpo.appendParagraph(`${paciente.cpf} ${formatarCPF(cpf)}`).setAttributes(eN);

  corpo.appendParagraph(declaracao.descricao.titulo).setAttributes(eS);
  const textoCorpo = declaracao.descricao.corpo
    .replace("{{NOME}}", nome)
    .replace("{{CPF}}", formatarCPF(cpf) || 'Não informado')
    .replace("{{VALOR}}", formatarMoeda(valorAberto));
  corpo.appendParagraph(textoCorpo).setAttributes(eN);
  
  const dataAtual = new Date();
  _adicionarAssinaturaERodape(corpo, dataAtual, { eN });
  doc.saveAndClose();
  return { doc, nomePaciente: nome, dataAtual };
}


// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

/**
 * Converte a string de alinhamento (definida em CONFIG) em um objeto DocumentApp.
 * Implementação da correção do TypeError.
 * @param {string} alinhamentoString String de alinhamento (e.g., "CENTER").
 * @returns {DocumentApp.HorizontalAlignment} Objeto de enumeração de alinhamento.
 */
function _traduzirAlinhamento(alinhamentoString) {
  const map = {
    'LEFT': DocumentApp.HorizontalAlignment.LEFT,
    'CENTER': DocumentApp.HorizontalAlignment.CENTER,
    'RIGHT': DocumentApp.HorizontalAlignment.RIGHT,
    'JUSTIFY': DocumentApp.HorizontalAlignment.JUSTIFY
  };
  return map[alinhamentoString] || DocumentApp.HorizontalAlignment.LEFT;
}

function _adicionarAssinaturaERodape(corpo, data, estilos) {
  const { assinatura, rodape } = CONFIG.DOCUMENTO.TEXTOS;
  const { ALINHAMENTO, LARGURA_IMAGEM_ASSINATURA, ALTURA_IMAGEM_ASSINATURA, ESTILOS } = CONFIG.DOCUMENTO;
  const { eN } = estilos;
  const dataFormatada = data.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });

  // CORREÇÃO 1: Alinhamento da data/cidade
  corpo.appendParagraph(`${assinatura.cidade}, ${dataFormatada}`)
    .setAttributes(eN)
    .setAlignment(_traduzirAlinhamento(ALINHAMENTO.DIREITA)); // <-- CORRIGIDO
  
  try {
    const imgBlob = DriveApp.getFileById(CONFIG.DRIVE.ID_DA_IMAGEM_ASSINATURA).getBlob();
    const pImg = corpo.appendParagraph('');
    pImg.appendInlineImage(imgBlob).setWidth(LARGURA_IMAGEM_ASSINATURA).setHeight(ALTURA_IMAGEM_ASSINATURA);
    
    // CORREÇÃO 2: Alinhamento da imagem
    pImg.setAlignment(_traduzirAlinhamento(ALINHAMENTO.CENTRO)).setSpacingBefore(12); // <-- CORRIGIDO
  } catch (e) {
    Logger.log("Erro ao carregar imagem da assinatura: " + e.message);
    // Alinhamento do texto substituto da assinatura
    corpo.appendParagraph("[Assinatura]").setAttributes(eN).setAlignment(_traduzirAlinhamento(ALINHAMENTO.CENTRO));
  }
  
  // CORREÇÃO 3: Alinhamento da linha de assinatura
  corpo.appendParagraph(assinatura.linha).setAttributes(eN).setAlignment(_traduzirAlinhamento(ALINHAMENTO.CENTRO)); // <-- CORRIGIDO
  
  // CORREÇÃO 4: Alinhamento do nome da farmácia
  corpo.appendParagraph(assinatura.nomeFarmacia).setAttributes(eN).setAlignment(_traduzirAlinhamento(ALINHAMENTO.CENTRO)); // <-- CORRIGIDO
  
  corpo.getParent().addFooter().appendParagraph(rodape.texto).setAttributes(_criarEstiloAtributos(ESTILOS.rodape));
}

function _gerarNomeArquivo(formato, nome, data) {
  const dia = ('0' + data.getDate()).slice(-2);
  const mes = ('0' + (data.getMonth() + 1)).slice(-2);
  const nomeCurto = nome.substring(0, 40);
  return formato.replace("{{NOME}}", nomeCurto).replace("{{DD}}", dia).replace("{{MM}}", mes);
}

function _salvarComoPdf(pasta, doc, nomeArquivo) {
  const pdf = pasta.createFile(doc.getAs('application/pdf')).setName(nomeArquivo + ".pdf");
  const pdfUrl = pdf.getUrl();
  
  try {
    // Tenta remover o doc temporário. Requer o Drive Service avançado.
    Drive.Files.remove(doc.getId()); 
  } catch (e) {
    Logger.log("Aviso: Falha ao remover documento temporário. Verifique se o Drive Service está habilitado. Erro: " + e.message);
  }
  
  return pdfUrl;
}

function _formatarCorpoDocumento(corpo) {
  corpo.setMarginTop(CONFIG.DOCUMENTO.MARGENS.superior)
    .setMarginBottom(CONFIG.DOCUMENTO.MARGENS.inferior)
    .setMarginLeft(CONFIG.DOCUMENTO.MARGENS.esquerda)
    .setMarginRight(CONFIG.DOCUMENTO.MARGENS.direita);
}

function _obterEstilosFormatados() {
    return {
      eT: _criarEstiloAtributos(CONFIG.DOCUMENTO.ESTILOS.titulo),
      eS: _criarEstiloAtributos(CONFIG.DOCUMENTO.ESTILOS.subtitulo),
      eN: _criarEstiloAtributos(CONFIG.DOCUMENTO.ESTILOS.textoNormal)
    };
}

function _criarEstiloAtributos(cfg) {
  let atr = {};
  if (cfg.fonte) atr[DocumentApp.Attribute.FONT_FAMILY] = cfg.fonte;
  if (cfg.tamanho) atr[DocumentApp.Attribute.FONT_SIZE] = cfg.tamanho;
  if (cfg.negrito !== undefined) atr[DocumentApp.Attribute.BOLD] = cfg.negrito;
  
  // Esta parte já usa o objeto DocumentApp correto, pois é lida diretamente do CONFIG.ESTILOS
  if (cfg.alinhamento) atr[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = cfg.alinhamento; 
  
  if (cfg.espacamentoLinhas) atr[DocumentApp.Attribute.LINE_SPACING] = cfg.espacamentoLinhas;
  if (cfg.espacamentoAntes !== undefined) atr[DocumentApp.Attribute.SPACING_BEFORE] = cfg.espacamentoAntes;
  if (cfg.espacamentoDepois !== undefined) atr[DocumentApp.Attribute.SPACING_AFTER] = cfg.espacamentoDepois;
  return atr;
}

function _adicionarCabecalhoPadrao(corpo, estilos) {
  const { estabelecimento } = CONFIG.DOCUMENTO.TEXTOS;
  const { eS, eN } = estilos;
  corpo.appendParagraph(CONFIG.DOCUMENTO.TEXTOS.orcamento.tituloPrincipal).setAttributes(_criarEstiloAtributos(CONFIG.DOCUMENTO.ESTILOS.titulo));
  corpo.appendParagraph(estabelecimento.titulo).setAttributes(eS);
  corpo.appendParagraph(estabelecimento.texto).setAttributes(eN);
}

function _determinarUnidadePeloNome(nomeMedicamento) {
  if (!nomeMedicamento) return 'unidade'; // Retorna padrão se o nome for nulo

  const nomeLower = nomeMedicamento.toLowerCase();

  // Palavras-chave para "caixa"
  if (nomeLower.includes('comprimido') || nomeLower.includes(' cp') || nomeLower.includes(' cpr') || nomeLower.includes(' drg')) {
    return 'caixa';
  }

  // Palavras-chave para "frasco"
  if (nomeLower.includes('frasco') || nomeLower.includes(' ml') || nomeLower.includes(' gotas') || nomeLower.includes(' sol') || nomeLower.includes(' xpe') || nomeLower.includes(' xarope')) {
    return 'frasco';
  }

  // Se nenhuma palavra-chave for encontrada, o padrão é "unidade"
  return 'unidade';
}