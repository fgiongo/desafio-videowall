const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 900;
const FAILURE_RATE = 0.15;

// IDs possuem exatamente 8 bytes ASCII: um prefixo de 3 bytes (`src` ou
// `mon`) e um número sequencial codificado em 5 dígitos Base64 URL-safe.
// O valor zero é representado por `AAAAA`; fontes e monitores começam em 0.
const BASE64URL_DIGITS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const SOURCE_ID_DIGITS = 5;
const INITIAL_SOURCE_COUNT = 12;
const MAX_ACTIVE_MOSAICS = 2;
const MONITOR_COUNT = 4;

let sourceNumber = 0;
let mosaicNumber = 0;

const rawSources = new Map(
  Array.from({ length: INITIAL_SOURCE_COUNT }, (_, index) => {
    const sourceNumber = index;
    const source = {
      id: createId("src", sourceNumber),
      name: `Fonte ${sourceNumber + 1}`,
      type: "raw",
    };
    return [source.id, source];
  }),
);
const monitorIds = new Set(
  Array.from({ length: MONITOR_COUNT }, (_, index) =>
    createId("mon", index),
  ),
);
const mosaicSources = new Map();
const monitorSources = new Map();

function createId(prefix, number) {
  const maxValue = BASE64URL_DIGITS.length ** SOURCE_ID_DIGITS;
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new TypeError("O número do identificador deve ser um inteiro não negativo.");
  }
  if (number >= maxValue) {
    throw new RangeError("Não há mais identificadores disponíveis.");
  }
  let value = number;
  let encoded = "";
  for (let index = 0; index < SOURCE_ID_DIGITS; index += 1) {
    encoded = BASE64URL_DIGITS[value % BASE64URL_DIGITS.length] + encoded;
    value = Math.floor(value / BASE64URL_DIGITS.length);
  }
  return `${prefix}${encoded}`;
}

async function simulateRequest(operation) {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
  if (Math.random() < FAILURE_RATE) {
    throw new Error(`Não foi possível concluir a operação: ${operation}.`);
  }
}

function getMosaicIds(sourceIds) {
  const mosaicIds = new Set();
  const pendingSourceIds = [...sourceIds];
  while (pendingSourceIds.length > 0) {
    const pendingSourceId = pendingSourceIds.pop();
    const mosaicSource = mosaicSources.get(pendingSourceId);
    if (!mosaicSource || mosaicIds.has(pendingSourceId)) {
      continue;
    }
    mosaicIds.add(pendingSourceId);
    pendingSourceIds.push(...mosaicSource.sourceIds);
  }
  return mosaicIds;
}

/**
 * Lista todas as fontes originais e todos os mosaicos cadastrados.
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   type: "raw"|"mosaic",
 *   sourceIds?: Array<string>
 * }>>}
 */
async function getSources() {
  await simulateRequest("listar fontes");
  const sources = [];
  for (const source of rawSources.values()) {
    sources.push({ ...source });
  }
  for (const source of mosaicSources.values()) {
    sources.push({ ...source, sourceIds: [...source.sourceIds] });
  }
  return sources;
}

/**
 * Simula a atribuição de uma fonte a um monitor físico.
 * @param {string} monitorId
 * @param {string} sourceId
 * @returns {Promise<{monitorId: string, sourceId: string}>}
 */
async function setMonitorSource(monitorId, sourceId) {
  if (!monitorIds.has(monitorId)) {
    throw new Error(`Monitor inexistente: ${monitorId}.`);
  }
  await simulateRequest("alterar fonte do monitor");
  const isRawSource = rawSources.has(sourceId);
  const isMosaicSource = mosaicSources.has(sourceId);
  if (!isRawSource && !isMosaicSource) {
    throw new Error(`Fonte inexistente: ${sourceId}.`);
  }
  const nextMonitorSources = new Map(monitorSources);
  nextMonitorSources.set(monitorId, sourceId);
  const activeMosaicIds = getMosaicIds([...nextMonitorSources.values()]);
  if (activeMosaicIds.size > MAX_ACTIVE_MOSAICS) {
    throw new Error(
      `Não é possível manter mais de ${MAX_ACTIVE_MOSAICS} mosaicos ativos.`,
    );
  }
  monitorSources.set(monitorId, sourceId);
  console.info("[mockApi] setMonitorSource", { monitorId, sourceId });
  return { monitorId, sourceId };
}

/**
 * Simula o cadastro de um mosaico e devolve uma nova fonte. O `id` retornado
 * pode ser usado tanto em `setMonitorSource` quanto em outro mosaico.
 * @param {Array<string|number>} sourceIds
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   type: "mosaic",
 *   sourceIds: Array<string|number>
 * }>}
 */
async function registerMosaic(sourceIds) {
  if (!Array.isArray(sourceIds) || sourceIds.length !== 4) {
    throw new TypeError("Um mosaico deve receber exatamente quatro fontes.");
  }
  await simulateRequest("cadastrar mosaico");
  for (const sourceId of sourceIds) {
    if (!rawSources.has(sourceId) && !mosaicSources.has(sourceId)) {
      throw new Error(`Fonte inexistente: ${sourceId}.`);
    }
  }
  if (getMosaicIds(sourceIds).size >= MAX_ACTIVE_MOSAICS) {
    throw new Error(
      `Um mosaico não pode ativar mais de ${MAX_ACTIVE_MOSAICS} mosaicos.`,
    );
  }
  const mosaicSource = {
    id: createId("src", INITIAL_SOURCE_COUNT + ++sourceNumber - 1),
    name: `Mosaico ${++mosaicNumber}`,
    type: "mosaic",
    sourceIds: [...sourceIds],
  };
  mosaicSources.set(mosaicSource.id, mosaicSource);
  console.info("[mockApi] registerMosaic", mosaicSource);
  return { ...mosaicSource, sourceIds: [...mosaicSource.sourceIds] };
}

/**
 * Exclui uma fonte criada como mosaico. Fontes originais não podem ser
 * excluídas.
 * @param {string} sourceId
 * @returns {Promise<{id: string}>}
 */
async function deleteSource(sourceId) {
  await simulateRequest("excluir fonte");
  if (rawSources.has(sourceId)) {
    throw new Error(`A fonte original ${sourceId} não pode ser excluída.`);
  }
  if (!mosaicSources.has(sourceId)) {
    throw new Error(`Fonte inexistente: ${sourceId}.`);
  }
  mosaicSources.delete(sourceId);
  console.info("[mockApi] deleteSource", { sourceId });
  return { id: sourceId };
}

export const api = {
  deleteSource,
  getSources,
  registerMosaic,
  setMonitorSource,
};
