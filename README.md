# Municípios do Ceará: mapa vetorial e tabela de atributos

Aplicação web em Next.js que desenha no mapa os municípios do Ceará (malha oficial do IBGE) e mostra a **tabela de atributos** de cada feição ao clique ou toque. Um `select` alterna entre os arquivos GeoJSON da pasta `public/`: a região Norte (44 municípios, com Sobral em destaque), o Ceará inteiro (184 municípios) e as camadas que você mesmo desenhar (pontos, linhas, polígonos).

Trabalho do **Exercício 07** da aula **SIG#07 – Mapas Vetoriais e Tabela de Atributos (Next.js PWA)**.

## Autor

- **Nome:** Tadeu dos Santos Jerônimo
- **Matrícula:** 2026202194
- **E-mail:** tadeus.jeronimo@gmail.com
- **Disciplina:** Tecnologias Back-End – IF Sudeste/MG

## O que o aplicativo faz

- **Select "Camada":** lista todo arquivo `.geojson` que estiver em `public/`. Ao trocar, o arquivo é baixado com `fetch`, o mapa se enquadra nas feições e o painel é reiniciado.
- **Municípios do IBGE:** os polígonos podem ser coloridos por região geográfica imediata ou por faixa de área (km²), com legenda. Sobral tem contorno escuro e o painel já abre com os atributos dela.
- **Qualquer outro GeoJSON:** pontos, linhas e polígonos ganham um estilo simples (azul), Popup e tabela com as colunas que o arquivo tiver.
- **Popup e Tabela de Atributos:** cada atributo aparece com nome legível (por exemplo, "Código IBGE") e o valor formatado (`2.068,474 km²`).
- **Tema claro e escuro:** o botão no canto superior direito alterna entre os dois. A escolha fica salva no navegador e, na primeira visita, vale a preferência do sistema. O mapa de fundo "Cinza", o Popup e as cores das feições acompanham o tema.
- **Resumo:** nas camadas de municípios, o painel calcula a posição do município por área e quanto a região imediata dele reúne.
- **Busca pelo nome** com autocompletar, na camada que estiver aberta.
- **Três mapas de fundo**, todos sem chave de API: Cinza (Esri Light Gray no tema claro, Dark Gray no escuro, com nomes por cima), Ruas (OpenStreetMap) e Satélite (Esri World Imagery).
- **Manifesto web** básico (`app/manifest.js`). Não há service worker nem ícones próprios, então o app ainda não é instalável nem funciona offline.

## Como executar

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Outros comandos:

```bash
npm run lint     # ESLint
npm run build    # versão de produção
npm run start    # serve a versão de produção
```

## Adicionando e alternando seus GeoJSON

1. No [geojson.io](https://geojson.io), desenhe pontos, linhas ou polígonos e preencha as propriedades de cada feição na tabela da lateral.
2. Salve o arquivo dentro de `public/`, por exemplo `public/sobral-pontos.geojson`.
3. Recarregue a página: o arquivo aparece no select "Camada". (Em `npm run start`, é preciso rodar `npm run build` de novo, porque a lista é montada no build.)

Os nomes `sobral-pontos.geojson` e `sobral-rio.geojson` já têm rótulos prontos ("Pontos de Sobral", "Rio Acaraú em Sobral"). Qualquer outro nome aparece com o nome do arquivo. Para dar um rótulo, edite a lista `CONHECIDAS` em `lib/camadas.js`.

Modelo mínimo de um arquivo de pontos (no GeoJSON a ordem é `[longitude, latitude]`):

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "NOME": "Nome do local", "TIPO": "Categoria", "BAIRRO": "Bairro" },
      "geometry": { "type": "Point", "coordinates": [-40.0, -3.7] }
    }
  ]
}
```

### Nomes legíveis para as suas colunas

As colunas que não estão em `lib/atributos.js` aparecem com o próprio nome. Para dar a elas um nome mais legível, acrescente entradas ao objeto `ATRIBUTOS`:

```js
TIPO: { rotulo: "Tipo de local" },
```

## Dados

Fonte: **IBGE, Malha Municipal 2024, Ceará** (`CE_Municipios_2024`, Shapefile em SIRGAS 2000).

Conversão feita com o Mapshaper, mantendo só as colunas usadas, reprojetando para WGS 84 e simplificando os limites para a Web:

```bash
npx mapshaper CE_Municipios_2024.shp \
  -simplify 4% keep-shapes \
  -filter-fields CD_MUN,NM_MUN,NM_RGI,NM_RGINT,AREA_KM2 \
  -proj wgs84 \
  -o precision=0.00001 ce-municipios.geojson format=geojson
```

O recorte Norte usa o mesmo comando, com um filtro a mais antes da reprojeção:

```bash
npx mapshaper CE_Municipios_2024.shp \
  -simplify 4% keep-shapes \
  -filter-fields CD_MUN,NM_MUN,NM_RGI,NM_RGINT,AREA_KM2 \
  -filter 'NM_RGINT == "Sobral"' \
  -proj wgs84 \
  -o precision=0.00001 ce-norte.geojson format=geojson
```

O IBGE não define uma "região Norte" oficial para o Ceará. Adotei a **Região Geográfica Intermediária de Sobral**: 44 municípios, em quatro regiões imediatas (Sobral, Acaraú, Camocim e São Benedito–Ipu–Guaraciaba do Norte–Tianguá).

| Campo | Significado | Tipo |
| --- | --- | --- |
| `CD_MUN` | Código do município no IBGE (Sobral = `2312908`) | texto |
| `NM_MUN` | Nome do município | texto |
| `NM_RGI` | Região geográfica imediata | texto |
| `NM_RGINT` | Região geográfica intermediária | texto |
| `AREA_KM2` | Área territorial em km² | número |

O código IBGE fica como texto porque é um identificador e não entra em cálculos. A área é número e é exibida no padrão brasileiro.

## Estrutura do projeto

```text
.
├── app/
│   ├── layout.js            estrutura HTML, título e idioma
│   ├── page.js              componente de servidor: lê public/ e lista os GeoJSON
│   ├── page.module.css      estilos da página
│   ├── globals.css          estilos globais e variáveis dos temas claro e escuro
│   ├── error.js             tela de erro com botão "Tentar de novo"
│   ├── not-found.js         página 404
│   ├── manifest.js          manifesto web
│   └── favicon.ico          ícone padrão do Next.js (template create-next-app)
├── components/
│   ├── Aplicativo.jsx       estado da página, cabeçalho, tabela de atributos e resumo
│   ├── AlternarTema.jsx     botão de tema claro/escuro
│   ├── MapaVetorial.jsx     mapa Leaflet, select de camadas, estilos, busca e legenda
│   └── MapaVetorial.module.css
├── lib/
│   ├── atributos.js         nomes legíveis e formatação dos atributos
│   ├── camadas.js           lista de camadas e detecção de camada de municípios
│   └── tema.js              leitura e gravação do tema (claro/escuro)
├── public/
│   ├── ce-norte.geojson     44 municípios da região Norte
│   ├── ce-municipios.geojson  184 municípios do Ceará
│   └── robots.txt
├── eslint.config.mjs
├── jsconfig.json            atalho de importação "@/"
├── next.config.mjs
├── package.json
├── .editorconfig
├── .gitignore
├── .nvmrc                   versão do Node usada (22)
├── LICENSE                  MIT
└── README.md
```

- `page.js` é um componente de servidor: usa `fs` para listar `public/` e entrega a lista ao `Aplicativo`.
- O tema fica no atributo `data-theme` do `<html>`. Um pequeno script em `layout.js` o define antes da primeira pintura (para a página não piscar) e as cores vêm de variáveis CSS em `globals.css`.
- `Aplicativo.jsx` carrega o mapa com `next/dynamic` (`ssr: false`, porque o Leaflet precisa do `window`) e guarda os atributos da feição selecionada.
- `MapaVetorial.jsx` busca o GeoJSON no `useEffect`, confere o `resposta.ok` antes de ler o JSON, usa `onEachFeature` para ligar Popup, destaque e clique a cada feição e envia os atributos para a página por uma função recebida como propriedade.

## Problemas comuns

**A página fica parada em "Carregando o mapa..."**

- **Abrindo pelo celular com `npm run dev`:** o Next 16 só libera o modo de desenvolvimento para `localhost`. Quem acessa por `http://IP_DO_COMPUTADOR:3000` fica sem o JavaScript do mapa, e o terminal mostra `Blocked cross-origin request to Next.js dev resource`. O projeto já resolve isso com `allowedDevOrigins` em `next.config.mjs`, que libera as faixas de IP de redes locais (`192.168.x.x`, `10.x.x.x` e `172.16` a `172.31`). Se o IP do seu computador estiver fora delas, acrescente-o à lista e reinicie o servidor.
- **Primeira abertura em modo `dev` demorada:** o Next compila o mapa e o Leaflet na primeira visita, o que pode levar de alguns segundos a mais de um minuto em computadores mais lentos. Para gravar o vídeo ou testar no celular, use a versão de produção:

  ```bash
  npm run build
  npm run start -- --hostname 0.0.0.0
  ```

**Marca d'água "API KEY REQUIRED" no fundo do mapa:** acontece com provedores de ladrilhos que passaram a exigir chave (foi o caso do Carto, que este projeto não usa mais). Os três fundos atuais não precisam de chave.

**Sem internet:** os ladrilhos do mapa de fundo vêm da internet. Sem conexão o fundo fica cinza, mas as feições continuam aparecendo.

## Validação

- `npm run lint` e `npm run build` concluem sem erros.
- Testei o aplicativo compilado em um navegador Chromium headless, com tela de 390 px de largura: troca entre as camadas pelo select (municípios, pontos e linha de teste), clique em feições, busca pelo nome, Popup e tabela de atributos, alternância de tema (inclusive depois de recarregar a página), sem erros de JavaScript.
- **Não testei em celular físico**, e os ladrilhos do mapa de fundo não carregam no ambiente de teste. Isso inclui o fundo cinza escuro do tema escuro: confira no seu aparelho antes de gravar o vídeo.

## Tecnologias

Next.js (App Router), React, Leaflet e React Leaflet, CSS Modules, ESLint, GeoJSON e Mapshaper.

## Créditos

- Limites municipais: **IBGE – Malha Municipal 2024**.
- Mapas de fundo: contribuidores do OpenStreetMap e Esri (Light Gray e World Imagery), com a atribuição exibida no próprio mapa.
- Estrutura da atividade baseada na aula SIG#07 do professor José Rui.
