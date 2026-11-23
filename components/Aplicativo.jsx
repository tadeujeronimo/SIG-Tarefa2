"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { descreverAtributo, formatarValor, tituloDaFeicao } from "@/lib/atributos";
import { COD_SOBRAL, ehCamadaMunicipal } from "@/lib/camadas";
import AlternarTema from "@/components/AlternarTema";
import styles from "@/app/page.module.css";

// O Leaflet precisa do window, que só existe no navegador
const MapaVetorial = dynamic(() => import("@/components/MapaVetorial"), {
    ssr: false,
    loading: () => <p className={styles.instrucaoVazio}>Carregando o mapa...</p>,
});

export default function Aplicativo({ camadas }) {
    const [arquivo, setArquivo] = useState(camadas[0]?.arquivo ?? null);
    const [dados, setDados] = useState(null);
    const [atributos, setAtributos] = useState(null);

    const camada = camadas.find((c) => c.arquivo === arquivo);
    const municipal = ehCamadaMunicipal(dados);

    function trocarArquivo(novo) {
        setArquivo(novo);
        setDados(null);
        setAtributos(null);
    }

    // Chamado pelo mapa quando o arquivo termina de carregar
    function aoCarregar(d) {
        setDados(d);
        if (ehCamadaMunicipal(d)) {
            const sobral = d.features.find((f) => f.properties.CD_MUN === COD_SOBRAL);
            setAtributos((atual) => atual ?? (sobral ? { ...sobral.properties } : null));
        }
    }

    // Números calculados a partir da própria tabela de atributos
    const resumo = useMemo(() => {
        if (!dados || !atributos?.CD_MUN || !ehCamadaMunicipal(dados)) return null;
        const todos = dados.features.map((f) => f.properties);
        const porArea = [...todos].sort((a, b) => b.AREA_KM2 - a.AREA_KM2);
        const posicao = porArea.findIndex((p) => p.CD_MUN === atributos.CD_MUN) + 1;
        const mesmaRegiao = todos.filter((p) => p.NM_RGI === atributos.NM_RGI);
        const areaRegiao = mesmaRegiao.reduce((soma, p) => soma + p.AREA_KM2, 0);
        return { posicao, total: todos.length, qtd: mesmaRegiao.length, areaRegiao };
    }, [dados, atributos]);

    if (!camadas.length) {
        return (
            <main className={styles.container}>
                <h1>Nenhum arquivo GeoJSON encontrado</h1>
                <p>Coloque arquivos <code>.geojson</code> na pasta <code>public/</code> e recarregue a página.</p>
            </main>
        );
    }

    const n = dados?.features.length;
    const subtitulo = !dados
        ? "Carregando o arquivo..."
        : municipal
          ? `IBGE, Malha Municipal 2024 · ${n} municípios`
          : `Arquivo ${camada?.nome} · ${n} ${n === 1 ? "feição" : "feições"}`;

    return (
        <main className={styles.container}>
            <div className={styles.topo}>
                <header className={styles.cabecalho}>
                    <h1>{camada?.rotulo}</h1>
                    <p>{subtitulo}</p>
                </header>
                <AlternarTema />
            </div>

            <section className={styles.mapaWrapper}>
                <MapaVetorial
                    camadas={camadas}
                    arquivo={arquivo}
                    onTrocarArquivo={trocarArquivo}
                    onSelecionar={setAtributos}
                    onDados={aoCarregar}
                />
            </section>

            <section className={styles.painel} aria-labelledby="titulo-atributos">
                <h2 id="titulo-atributos">Tabela de Atributos</h2>

                {atributos ? (
                    <>
                        <p className={styles.selecionado}>
                            Feição selecionada: <strong>{tituloDaFeicao(atributos)}</strong>
                        </p>

                        <div className={styles.tabelaWrapper}>
                            <table className={styles.tabela}>
                                <thead>
                                    <tr>
                                        <th scope="col">Atributo</th>
                                        <th scope="col">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(atributos).map(([chave, valor]) => (
                                        <tr key={chave}>
                                            <th scope="row">{descreverAtributo(chave).rotulo}</th>
                                            <td>{formatarValor(chave, valor)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {resumo && (
                            <p className={styles.resumo}>
                                {atributos.NM_MUN} é o {resumo.posicao}º maior município {camada?.escopo} em área (de{" "}
                                {resumo.total}). A região imediata {atributos.NM_RGI} reúne {resumo.qtd} municípios,
                                somando {resumo.areaRegiao.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} km².
                            </p>
                        )}
                    </>
                ) : (
                    <p className={styles.instrucaoVazio}>Clique ou toque em uma feição do mapa para ver os atributos.</p>
                )}
            </section>
            
            <footer className={styles.rodape}>
                Tadeu dos Santos Jerônimo (2026202194) · Tarefa 2 de SIG na Web do IF Sudeste/MG: Exercício 07 da aula SIG#07 – Mapas Vetoriais e Tabela de Atributos (Next.js PWA).
            </footer>
        </main>
    );
}
