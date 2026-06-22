# Desafio técnico — Controle de videowall

## Objetivo

Desenvolver o frontend de uma aplicação web que simule o controle de um
videowall formado por quatro monitores. O exercício busca avaliar raciocínio,
organização do código, modelagem de estado e construção de uma interface clara.

A solução deve ser desenvolvida em **HTML, CSS e JavaScript nativos (vanilla)**.
Não devem ser usados frameworks ou bibliotecas de frontend, como React, Vue,
Angular ou similares.

## Cenário

Imagine uma sala de controle com um **videowall**, isto é, um painel formado por
vários monitores físicos que funcionam lado a lado. Neste desafio, o videowall
possui quatro monitores organizados em uma matriz 2 × 2:

```text
+-----------+-----------+
| Monitor 1 | Monitor 2 |
+-----------+-----------+
| Monitor 3 | Monitor 4 |
+-----------+-----------+
```

O sistema recebe 12 fontes de vídeo originais. Em uma instalação real, essas
fontes poderiam representar câmeras, computadores, receptores ou outros
equipamentos. Neste exercício elas são apenas entidades identificadas por nome e
ID; não é necessário reproduzir seus vídeos.

Entre as fontes e os monitores existe um **sistema de multiplexação de vídeo**,
representado por uma **matriz comutadora**. Esse equipamento recebe várias
fontes como entrada e permite escolher qual delas será encaminhada para cada
monitor. A mesma interface controla essas conexões: quando o operador atribui
uma fonte a um monitor, a aplicação envia um comando para a matriz comutadora
por meio da API mockada.

O sistema também possui **dois processadores de mosaico**. Cada processador
recebe quatro fontes, organiza essas entradas em uma composição 2 × 2 e produz
uma nova saída. Essa saída volta para a matriz comutadora e passa a ser tratada
como qualquer outra fonte: pode ser atribuída a um monitor ou usada como entrada
de outro mosaico.

```text
12 fontes originais ───────┐
                           ├──> Matriz comutadora ──> 4 monitores
2 processadores de mosaico ┘            │
          ▲                              │
          └──── quatro fontes por mosaico
```

Um **mosaico cadastrado** representa uma configuração salva: quais quatro fontes
serão usadas e em qual posição. É possível cadastrar várias configurações. Um
mosaico se torna **ativo** quando sua configuração precisa ocupar um dos dois
processadores físicos, seja porque foi atribuído a um monitor, seja porque serve
de entrada para outro mosaico ativo.

Como existem somente dois processadores, no máximo dois mosaicos distintos podem
estar ativos ao mesmo tempo. Por exemplo, o Mosaico B pode usar o Mosaico A como
uma de suas entradas; nesse caso, A ocupa um processador e B ocupa o outro. Uma
configuração que também dependesse de um terceiro mosaico não poderia ser
executada pelo hardware disponível.

A aplicação a ser construída é a interface usada pelo operador para visualizar
as fontes, cadastrar mosaicos e comandar a matriz comutadora. O arquivo
`api.js` simula a comunicação com esses equipamentos.

## Requisitos funcionais

A interface deve permitir:

1. visualizar e identificar as 12 fontes originais;
2. atribuir uma fonte original a qualquer um dos quatro monitores;
3. visualizar claramente o estado atual do videowall em uma representação 2 × 2
   que imite a disposição física dos monitores;
4. cadastrar um mosaico 2 × 2 escolhendo quatro fontes existentes;
5. visualizar os mosaicos criados junto às demais fontes disponíveis;
6. atribuir um mosaico a qualquer monitor;
7. excluir um mosaico criado;
8. comunicar ações importantes por meio da API mockada fornecida;
9. informar ao usuário quando uma operação estiver em andamento ou falhar.

A representação do videowall deve ser imediatamente reconhecível como um painel
com quatro monitores. Cada área deve preservar sua posição física — monitores 1
e 2 na linha superior, monitores 3 e 4 na linha inferior — e identificar
claramente o monitor e a fonte exibida. Mostrar o estado apenas em uma lista ou
tabela não atende a esse requisito.

As fontes podem ser diferenciadas por texto, cor, ícone ou outra representação
visual. Não é necessário carregar ou reproduzir vídeos.

## Regras de negócio

- Existem exatamente quatro monitores físicos.
- Os identificadores válidos dos monitores são `monAAAAA`, `monAAAAB`,
  `monAAAAC` e `monAAAAD`.
- Existem 12 fontes originais.
- Cada monitor exibe uma única fonte por vez: original ou mosaico.
- Um mosaico possui exatamente quatro entradas e a posição de cada entrada deve
  ser preservada.
- Fontes originais e mosaicos devem fazer parte da mesma coleção de fontes
  disponíveis. Depois de criado, um mosaico participa das mesmas operações que
  qualquer outra fonte.
- Identificadores de fontes devem ser tratados como valores opacos fornecidos
  pela API. A interface não deve interpretar ou gerar esses valores.
- As quatro entradas não precisam ser distintas.
- Um mosaico pode usar fontes originais e mosaicos criados anteriormente.
- Um mosaico é imutável depois de criado.
- Podem ser cadastrados quantos mosaicos o usuário desejar.
- Existem exatamente dois processadores físicos de mosaico.
- No máximo dois mosaicos distintos podem estar ativos ao mesmo tempo. Um
  mosaico é considerado ativo quando está atribuído a pelo menos um monitor ou
  quando é entrada, direta ou indireta, de outro mosaico ativo. Exibir o mesmo
  mosaico em mais de um monitor continua contando como um único mosaico ativo.
- Todo mosaico cadastrado deve poder ser executado usando os dois processadores
  disponíveis. Por isso, um mosaico pode depender de, no máximo, um outro
  mosaico em toda a sua árvore de entradas.
  - Válido: o Mosaico B usa o Mosaico A como entrada.
  - Inválido: o Mosaico C usa os Mosaicos A e B como entradas.
  - Inválido: o Mosaico C usa o Mosaico B, que já usa o Mosaico A.
- Apenas mosaicos podem ser excluídos. As 12 fontes originais são permanentes.
- Depois que um mosaico for excluído, outro poderá ser criado sem reutilizar o
  identificador anterior.
- Se uma chamada da API falhar, o estado solicitado não deve ser aplicado e o
  usuário deve receber uma mensagem compreensível.

Exemplo: o primeiro mosaico pode combinar as fontes 1, 2, 3 e 4. Depois de
criado, ele pode ser exibido em um monitor ou usado como uma das quatro entradas
do segundo mosaico.

## Representação das fontes

Este desafio não exige arquivos de vídeo, URLs externas, elementos `<video>` ou
reprodução de streams. As fontes devem ser representadas por componentes
visuais simples, como cartões, blocos coloridos, nomes e ícones.

O videowall deve deixar claro qual fonte está atribuída a cada monitor. Ao
exibir um mosaico, represente suas quatro entradas na disposição 2 × 2. Caso uma
entrada seja outro mosaico, basta identificá-la como mosaico; não é necessário
expandir sua estrutura recursivamente na interface.

## API mockada

O arquivo [`api.js`](./api.js) simula o backend que controlaria a matriz de
vídeo. Ele exporta um objeto `api` com os seguintes métodos assíncronos:

A referência completa do contrato, dos modelos e das possíveis falhas está em
[`API.md`](./API.md).

```js
api.getSources()
api.setMonitorSource(monitorId, sourceId)
api.registerMosaic(sourceIds)
api.deleteSource(sourceId)
```

As chamadas possuem latência artificial e podem falhar ocasionalmente. A
interface deve aguardar o resultado antes de confirmar uma alteração. Não
modifique `api.js` para remover esses comportamentos; trate os estados de
carregamento e erro na interface.

`getSources` retorna as 12 fontes originais e todos os mosaicos cadastrados. A
interface deve usar esse resultado como fonte de verdade para sua lista de
fontes disponíveis.

`registerMosaic` resolve com uma nova fonte do tipo `mosaic`. Todas as quatro
fontes informadas devem existir. O identificador
retornado pode ser enviado para um monitor ou incluído no array de fontes de uma
chamada posterior a `registerMosaic`:

```js
const firstMosaic = await api.registerMosaic([
  "srcAAAAA",
  "srcAAAAB",
  "srcAAAAC",
  "srcAAAAD",
]);

await api.registerMosaic([
  firstMosaic.id,
  "srcAAAAE",
  "srcAAAAF",
  "srcAAAAG",
]);
```

`setMonitorSource` rejeita identificadores de fonte inexistentes.
O identificador deve corresponder a um dos quatro monitores, de `monAAAAA`
a `monAAAAD`.
`deleteSource` remove apenas fontes do tipo mosaico e rejeita a tentativa de
excluir uma fonte original ou inexistente.

A API mantém o registro das fontes e das atribuições aos monitores. A aplicação
continua responsável por manter seu estado de apresentação e atualizar a
interface depois de cada operação.

## Projeto inicial

O repositório contém apenas um esqueleto intencionalmente mínimo:

```text
.
├── README.md
├── API.md
├── api.js
├── index.html
├── index.js
├── style.css
└── serve.py
```

Para iniciar o servidor local, execute:

```bash
python3 serve.py
```

Depois, acesse `http://localhost:8000`. Para usar outra porta:

```bash
python3 serve.py 3000
```

O projeto deve continuar executável diretamente no navegador por meio do
servidor fornecido. Não adicione ferramentas de build, gerenciadores de pacotes,
frameworks ou bibliotecas externas.

## O que será avaliado

- clareza e usabilidade da interface;
- representação visual do videowall e dos mosaicos;
- modelagem e atualização consistente do estado;
- cumprimento das regras de negócio;
- integração assíncrona com a API e tratamento de erros;
- organização e legibilidade do código;
- manipulação de eventos e uso adequado de HTML, CSS e JavaScript;
- capacidade de explicar decisões, limitações e possíveis melhorias;
- evolução da solução durante o tempo disponível.

Design visual avançado e animações sofisticadas não fazem parte da avaliação.

## Condições da entrevista

Durante o exercício, o candidato pode consultar mecanismos de busca e
documentação pública, além de tirar dúvidas com o entrevistador. Não é permitido
usar ferramentas de inteligência artificial, copiar soluções de terceiros ou
usar código próprio preparado anteriormente.
