function formatarCPF(cpf) {
  if (!cpf) return "";
  const cleaned = String(cpf).replace(/\D/g, '').padStart(11, '0').slice(-11);
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatarMoeda(n) {
  const valor = Number(n) || 0;
  return 'R$ ' + valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

/**
 * Inclui o conteúdo de um arquivo HTML dentro de outro.
 * Usado para importar CSS e JS nos arquivos HTML principais.
 * @param {string} filename O nome do arquivo a ser incluído.
 * @return {string} O conteúdo do arquivo.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet(e) {
  // Use 'createTemplateFromFile' para indicar que o HTML precisa ser processado
  var template = HtmlService.createTemplateFromFile('MenuPrincipal');

  // O método '.evaluate()' executa o processamento (como os 'includes')
  // e retorna o HTML final para ser exibido.
  return template.evaluate();
}
