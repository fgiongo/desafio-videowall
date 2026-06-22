# Referência da API mockada

O arquivo [`api.js`](./api.js) simula o backend responsável por controlar os
monitores e cadastrar fontes virtuais. Todas as funções públicas retornam
`Promise`. O módulo exporta um único objeto chamado `api`:

```js
import { api } from "./api.js";
```

## Comportamento de rede

Cada operação concluída pela API possui uma latência artificial aleatória entre
300 e 900 milissegundos e 15% de probabilidade de falha.

Uma falha de rede rejeita a `Promise` com uma mensagem semelhante a:

```text
Não foi possível concluir a operação: listar fontes.
```

Operações que falham não alteram o estado mantido pela API. A interface deve
exibir um estado de carregamento, aguardar a `Promise` e tratar sua rejeição.

## Identificadores

IDs são strings opacas. A aplicação deve armazenar e devolver os valores
fornecidos pela API sem tentar interpretá-los ou gerar novos IDs.

Os quatro monitores válidos são:

```text
monAAAAB
monAAAAC
monAAAAD
monAAAAE
```

## Modelos

### Fonte original

```js
{
  id: "srcAAAAB",
  name: "Fonte 1",
  type: "raw"
}
```

### Mosaico

Um mosaico também é uma fonte. `sourceIds` preserva a posição das quatro
entradas na matriz 2 × 2.

```js
{
  id: "srcAAAAN",
  name: "Mosaico 1",
  type: "mosaic",
  sourceIds: [
    "srcAAAAB",
    "srcAAAAC",
    "srcAAAAD",
    "srcAAAAE"
  ]
}
```

## `api.getSources()`

Retorna todas as fontes originais e todos os mosaicos cadastrados.

```js
const sources = await api.getSources();
```

### Retorno

```ts
Promise<Array<RawSource | MosaicSource>>
```

Os objetos e os arrays retornados são cópias. Alterá-los não modifica o estado
interno da API.

### Possíveis falhas

- falha de rede simulada.

## `api.registerMosaic(sourceIds)`

Cadastra um mosaico e o disponibiliza como uma nova fonte.

```js
const mosaic = await api.registerMosaic([
  "srcAAAAB",
  "srcAAAAC",
  "srcAAAAD",
  "srcAAAAE",
]);
```

### Parâmetros

- `sourceIds`: array contendo exatamente quatro IDs de fontes existentes;
- uma entrada pode ser uma fonte original ou um mosaico;
- entradas repetidas são permitidas;
- a ordem das entradas deve ser preservada.

### Retorno

```ts
Promise<MosaicSource>
```

O retorno contém o ID, o nome, o tipo e uma cópia dos quatro IDs de entrada.
IDs de mosaicos excluídos não são reutilizados em cadastros posteriores.

### Limite de dependências

Um mosaico pode ser cadastrado somente quando ele próprio e todos os mosaicos
distintos usados direta ou indiretamente como entrada totalizarem, no máximo,
dois mosaicos.

Um mosaico com uma única dependência de mosaico é válido:

```text
Mosaico B -> Mosaico A -> fontes originais
```

Um mosaico com duas dependências distintas é inválido porque ativá-lo exigiria
três mosaicos:

```text
Mosaico C -> Mosaico A
          -> Mosaico B
```

Referenciar o mesmo submosaico mais de uma vez continua contando como uma única
dependência.

### Possíveis falhas

- o argumento não é um array com exatamente quatro elementos;
- uma das fontes não existe;
- o grafo resultante ultrapassa o limite de dois mosaicos;
- falha de rede simulada.

## `api.setMonitorSource(monitorId, sourceId)`

Atribui uma fonte original ou um mosaico a um monitor.

```js
await api.setMonitorSource("monAAAAB", "srcAAAAN");
```

### Parâmetros

- `monitorId`: um dos quatro IDs de monitor válidos;
- `sourceId`: ID de uma fonte original ou de um mosaico cadastrado.

### Retorno

```js
{
  monitorId: "monAAAAB",
  sourceId: "srcAAAAN"
}
```

### Limite de mosaicos ativos

No máximo dois mosaicos distintos podem estar ativos no sistema. Um mosaico é
ativo quando:

- está atribuído diretamente a um monitor; ou
- é dependência direta ou indireta de um mosaico atribuído a um monitor.

O mesmo mosaico encontrado por mais de um caminho é contado uma única vez.
Reatribuir um monitor substitui sua atribuição anterior antes do cálculo do
limite.

Exemplo: se o Mosaico B usa o Mosaico A como entrada, atribuir B ativa A e B.
Enquanto essa atribuição existir, atribuir qualquer outro mosaico a outro
monitor será rejeitado.

### Possíveis falhas

- o monitor não existe;
- a fonte não existe;
- a atribuição ativaria mais de dois mosaicos distintos;
- falha de rede simulada.

## `api.deleteSource(sourceId)`

Exclui uma fonte do tipo mosaico.

```js
await api.deleteSource("srcAAAAN");
```

### Parâmetros

- `sourceId`: ID do mosaico que será excluído.

### Retorno

```js
{
  id: "srcAAAAN"
}
```

### Possíveis falhas

- o ID pertence a uma das 12 fontes originais;
- a fonte não existe ou já foi excluída;
- falha de rede simulada.

## Estado mantido pela API

A API mantém internamente:

- as 12 fontes originais;
- os mosaicos cadastrados;
- a fonte atualmente atribuída a cada monitor;
- os contadores usados para gerar novos IDs e nomes.

A aplicação ainda deve manter seu próprio estado de apresentação. Depois de uma
operação bem-sucedida, ela pode atualizar seu estado local ou consultar
`api.getSources()` novamente quando precisar sincronizar a lista de fontes.
