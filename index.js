import { api } from "./api.js";

const app = document.querySelector("#app");

if (!app) {
  throw new Error('Elemento raiz "#app" não encontrado.');
}

// Exemplo de como chamar a API mockada:
// O CANDIDATO DEVE APAGAR ESTE BLOCO
void (async () => {
  try {

    // Todas as chamadas retornam Promises e devem ser aguardadas.
    const sources = await api.getSources();
    console.info("Resposta de api.getSources():", sources);

    // Exemplo deliberadamente inválido: esse monitor não existe.
    // Erros esperados podem ser tratados perto da ação que os originou.
    try {
      await api.setMonitorSource("monINVALID", sources[0].id);
    } catch (error) {
      console.warn("Erro esperado no exemplo inválido:", error.message);
    }

    // Um mosaico recebe exatamente quatro IDs de fontes existentes.
    const rawSourceIds = sources
      .filter((source) => source.type === "raw")
      .slice(0, 4)
      .map((source) => source.id);
    const mosaic = await api.registerMosaic(rawSourceIds);
    console.info("Resposta de api.registerMosaic():", mosaic);

    // Mosaicos são fontes e usam o mesmo campo sourceId na atribuição.
    const mosaicAssignment = await api.setMonitorSource("monAAAAB", mosaic.id);
    console.info("Resposta ao atribuir o mosaico:", mosaicAssignment);

    // Antes de excluir o mosaico, substituímos sua atribuição por uma fonte raw.
    const rawAssignment = await api.setMonitorSource(
      "monAAAAB",
      rawSourceIds[0],
    );
    console.info("Resposta ao atribuir a fonte raw:", rawAssignment);
    const deletion = await api.deleteSource(mosaic.id);
    console.info("Resposta de api.deleteSource():", deletion);

  } catch (error) {
    // A API também simula falhas de rede, então todo fluxo precisa tratar erros.
    console.error("Falha ao executar exemplos da API:", error);
  }
})();
