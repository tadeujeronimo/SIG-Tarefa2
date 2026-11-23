# SIG-Tarefa2: Mapa vetorial dos municípios do Ceará

Aplicação em Next.js que mostra no mapa os municípios do Ceará (malha do IBGE 2024) e, ao clicar em uma feição, exibe seus atributos em um Popup e na Tabela de Atributos. Um `select` alterna entre os arquivos GeoJSON da pasta `public/`.

Projeto para Tarefa 2 de Sistemas de Informações Geográficas na Web: Exercício 07 da aula SIG#07 – Mapas Vetoriais e Tabela de Atributos (Next.js PWA).

## Funcionalidades

- Select "Camada" com todos os `.geojson` de `public/`: Norte do Ceará (44 municípios), Ceará (184) e as camadas que você adicionar.
- Municípios coloridos por região imediata ou por área, com Sobral em destaque.
- Pontos, linhas e polígonos próprios com estilo simples, Popup e tabela.
- Busca pelo nome, três mapas de fundo (Cinza, Ruas, Satélite) e tema claro/escuro.

## Como executar

Requer Node.js 20.9 ou superior.

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:3000
npm run build    # versão de produção
npm run start    # serve a versão de produção
npm run lint     # ESLint
```

## Adicionando seus GeoJSON

1. Desenhe no [geojson.io](https://geojson.io) e preencha as propriedades de cada feição.
2. Salve em `public/`, por exemplo `public/sobral-pontos.geojson`.
3. Recarregue a página: o arquivo aparece no select. Em `npm run start`, rode `npm run build` de novo.

Para dar um nome ao arquivo no select, edite `lib/camadas.js`. Para dar um nome legível a uma coluna, edite `lib/atributos.js`.

## Dados

IBGE, Malha Municipal 2024 (Ceará), convertida com o Mapshaper:

```bash
npx mapshaper CE_Municipios_2024.shp \
  -simplify 4% keep-shapes \
  -filter-fields CD_MUN,NM_MUN,NM_RGI,NM_RGINT,AREA_KM2 \
  -proj wgs84 \
  -o precision=0.00001 ce-municipios.geojson format=geojson
```

O recorte Norte é o mesmo arquivo filtrado por `NM_RGINT == "Sobral"` (Região Geográfica Intermediária de Sobral, 44 municípios), pois o IBGE não define uma "região Norte" oficial.

## Tecnologias

Next.js (App Router), React, Leaflet e React Leaflet, CSS Modules, ESLint, GeoJSON e Mapshaper.

## Estrutura

```text
app/          página (lê public/), layout, estilos, 404, erro e manifesto
components/   Aplicativo (página e tabela), MapaVetorial (mapa), AlternarTema
lib/          atributos.js, camadas.js, tema.js
public/       ce-norte.geojson, ce-municipios.geojson, robots.txt
```

## Problemas comuns

- **Preso em "Carregando o mapa..." no celular com `npm run dev`:** o Next 16 só libera o modo dev para `localhost`. O `next.config.mjs` já libera os IPs de rede local (`192.168.x.x`, `10.x.x.x`, `172.16–31.x.x`). Para gravar o vídeo, prefira `npm run build && npm run start -- --hostname 0.0.0.0`.
- **Fundo do mapa cinza:** os ladrilhos precisam de internet.

## Créditos

- Limites municipais: **IBGE – Malha Municipal 2024**.
- Mapas de fundo: contribuidores do OpenStreetMap e Esri (Light Gray e World Imagery), com a atribuição exibida no próprio mapa.
- Estrutura da atividade baseada na aula SIG#07 do professor José Rui.

## Autor

- **Nome**: Tadeu dos Santos Jerônimo
- **Matrícula**: 2026202194
- **E-mail**: tadeus.jeronimo@gmail.com
- **Disciplina**: Sistemas de Informações Geográficas na Web - IF Sudeste/MG

## Licença

Consulte o arquivo [LICENSE](./LICENSE).
