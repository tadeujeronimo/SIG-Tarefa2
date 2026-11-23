"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { descreverAtributo, formatarValor, tituloDaFeicao } from "@/lib/atributos";
import { COD_SOBRAL, ehCamadaMunicipal } from "@/lib/camadas";
import { useTema } from "@/lib/tema";
import estilos from "./MapaVetorial.module.css";

const CENTRO_CEARA = [-5.2, -39.3]; // [latitude, longitude]

// Mapas de fundo gratuitos e sem chave de API.
// (O Carto passou a exigir chave e mostra "API KEY REQUIRED", por isso não é usado.)
const ATRIB_ESRI = "Tiles &copy; Esri";
const BASES = {
    cinza: {
        rotulo: "Cinza",
        // segue o tema da página: cinza claro no tema claro, cinza escuro no tema escuro
        camadas: (escuro) => {
            const nome = escuro ? "World_Dark_Gray" : "World_Light_Gray";
            return [
                {
                    url: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${nome}_Base/MapServer/tile/{z}/{y}/{x}`,
                    attribution: ATRIB_ESRI,
                    maxNativeZoom: 16,
                },
                {
                    // nomes de cidades e rodovias por cima do cinza
                    url: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${nome}_Reference/MapServer/tile/{z}/{y}/{x}`,
                    attribution: ATRIB_ESRI,
                    maxNativeZoom: 16,
                },
            ];
        },
    },
    ruas: {
        rotulo: "Ruas",
        camadas: () => [
            {
                url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxNativeZoom: 19,
            },
        ],
    },
    satelite: {
        rotulo: "Satélite",
        camadas: () => [
            {
                url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                attribution: "&copy; Esri World Imagery",
                maxNativeZoom: 19,
            },
        ],
    },
};

const FAIXAS_AREA = [
    { max: 200, cor: "#ffffd4", rotulo: "até 200 km²" },
    { max: 400, cor: "#fed98e", rotulo: "200 a 400 km²" },
    { max: 700, cor: "#fe9929", rotulo: "400 a 700 km²" },
    { max: 1200, cor: "#d95f0e", rotulo: "700 a 1.200 km²" },
    { max: Infinity, cor: "#993404", rotulo: "mais de 1.200 km²" },
];

function corArea(area) {
    return FAIXAS_AREA.find((f) => area <= f.max).cor;
}

// Cores suaves, espalhadas pelo círculo de matizes para vizinhas não ficarem parecidas
function corRegiao(nome, regioes, escuro) {
    const i = Math.max(0, regioes.indexOf(nome));
    const matiz = ((i * 7) % regioes.length) * (360 / regioes.length);
    return `hsl(${Math.round(matiz)}, 42%, ${escuro ? 58 : 72}%)`;
}

function estiloMunicipio(feature, modo, regioes, escuro) {
    const p = feature.properties;
    const estilo = {
        color: escuro ? "#4b5563" : "#6b7280",
        weight: 0.8,
        opacity: 1,
        fillOpacity: 0.75,
        fillColor: modo === "area" ? corArea(p.AREA_KM2) : corRegiao(p.NM_RGI, regioes, escuro),
    };
    return p.CD_MUN === COD_SOBRAL ? { ...estilo, color: escuro ? "#f9fafb" : "#111827", weight: 3 } : estilo;
}

// Camadas que não são de municípios (seus pontos, linhas e polígonos)
function estiloGenerico(feature, escuro) {
    const cor = escuro ? "#60a5fa" : "#1d4ed8";
    const tipo = feature.geometry?.type ?? "";
    if (tipo.includes("Point")) {
        return { radius: 7, color: escuro ? "#111827" : "#ffffff", weight: 2, fillColor: cor, fillOpacity: 1 };
    }
    return { color: cor, weight: 3, opacity: 1, fillColor: cor, fillOpacity: 0.25 };
}

function escapar(valor) {
    return String(valor).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizar(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function montarPopup(atributos, tituloPadrao) {
    const titulo = tituloDaFeicao(atributos, tituloPadrao);
    const linhas = Object.entries(atributos)
        .filter(([chave]) => chave !== "NM_MUN") // o nome já vai no título
        .map(
            ([chave, valor]) => `<tr>
                <td style="padding:2px 12px 2px 0;color:var(--texto-suave);">${escapar(descreverAtributo(chave).rotulo)}</td>
                <td style="padding:2px 0;font-weight:600;">${escapar(formatarValor(chave, valor))}</td>
            </tr>`
        )
        .join("");
    return `<div style="font-family:system-ui,sans-serif;font-size:12px;color:var(--texto);min-width:180px;">
        <div style="font-size:15px;font-weight:700;margin-bottom:6px;">${escapar(titulo)}</div>
        <table style="border-collapse:collapse;">${linhas}</table>
    </div>`;
}

export default function MapaVetorial({ camadas, arquivo, onTrocarArquivo, onSelecionar, onDados }) {
    const [resultado, setResultado] = useState(null); // { arquivo, dados, erro }
    const [modo, setModo] = useState("regiao"); // "regiao" | "area"
    const [base, setBase] = useState("cinza");
    const [busca, setBusca] = useState("");
    const [aviso, setAviso] = useState("");

    const mapaRef = useRef(null);
    const feicoesRef = useRef(new Map()); // feição -> camada do Leaflet
    const estiloRef = useRef(null);
    const onDadosRef = useRef(onDados);

    // Só vale o resultado do arquivo que está selecionado agora
    const atual = resultado?.arquivo === arquivo ? resultado : null;
    const dados = atual?.dados ?? null;
    const erro = atual?.erro ?? null;
    const carregando = !atual;

    const municipal = useMemo(() => ehCamadaMunicipal(dados), [dados]);
    const regioes = useMemo(
        () => (municipal ? [...new Set(dados.features.map((f) => f.properties.NM_RGI))].sort() : []),
        [dados, municipal]
    );
    const nomes = useMemo(() => {
        if (!dados) return [];
        const todos = dados.features.map((f) => tituloDaFeicao(f.properties, "")).filter(Boolean);
        return [...new Set(todos)].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [dados]);
    const rotuloCamada = camadas.find((c) => c.arquivo === arquivo)?.rotulo ?? arquivo;

    const escuro = useTema() === "dark";

    const estilo = useCallback(
        (feature) => (municipal ? estiloMunicipio(feature, modo, regioes, escuro) : estiloGenerico(feature, escuro)),
        [municipal, modo, regioes, escuro]
    );

    // Os handlers de mouse lêem estes valores no momento do evento
    useEffect(() => {
        estiloRef.current = estilo;
        onDadosRef.current = onDados;
    }, [estilo, onDados]);

    // Baixa o arquivo escolhido no select
    useEffect(() => {
        let ativo = true;
        fetch(arquivo)
            .then((r) => {
                if (!r.ok) throw new Error(`Não encontrei ${arquivo} (HTTP ${r.status}). Confira se o arquivo está em public/.`);
                return r.json();
            })
            .then((d) => {
                if (!ativo) return;
                setResultado({ arquivo, dados: d, erro: null });
                onDadosRef.current?.(d, arquivo);
            })
            .catch((e) => {
                if (!ativo) return;
                console.error(e);
                setResultado({ arquivo, dados: null, erro: e.message });
            });
        return () => {
            ativo = false;
        };
    }, [arquivo]);

    // Quando os dados chegam: enquadra o mapa e põe Sobral por cima das vizinhas
    useEffect(() => {
        if (!dados) return;
        if (municipal) {
            const sobral = dados.features.find((f) => f.properties.CD_MUN === COD_SOBRAL);
            feicoesRef.current.get(sobral)?.bringToFront();
        }
        const limites = L.geoJSON(dados).getBounds();
        if (limites.isValid()) mapaRef.current?.fitBounds(limites, { padding: [20, 20], maxZoom: 15 });
    }, [dados, municipal]);

    function aoConfigurarFeicao(feature, layer) {
        const p = feature.properties ?? {};
        feicoesRef.current.set(feature, layer);
        layer.bindPopup(montarPopup(p, rotuloCamada));
        layer.on({
            mouseover: () => layer.setStyle(municipal ? { weight: 2.5, fillOpacity: 0.92 } : { weight: 5 }),
            mouseout: () => layer.setStyle(estiloRef.current(feature)),
            click: () => onSelecionar({ ...p }),
        });
    }

    function trocarCamada(e) {
        setAviso("");
        setBusca("");
        onTrocarArquivo(e.target.value);
    }

    function buscar(e) {
        e.preventDefault();
        if (!dados) return;
        const alvo = dados.features.find((f) => normalizar(tituloDaFeicao(f.properties, "")) === normalizar(busca));
        const layer = alvo && feicoesRef.current.get(alvo);
        if (!layer) {
            setAviso("Nada com esse nome nesta camada.");
            return;
        }
        setAviso("");
        if (layer.getBounds) {
            mapaRef.current?.flyToBounds(layer.getBounds(), { maxZoom: 11, duration: 0.8 });
        } else {
            mapaRef.current?.flyTo(layer.getLatLng(), 15, { duration: 0.8 });
        }
        layer.openPopup();
        onSelecionar({ ...alvo.properties });
    }

    return (
        <div className={estilos.raiz}>
            <div className={estilos.barra}>
                <label>
                    Camada{" "}
                    <select value={arquivo} onChange={trocarCamada}>
                        {camadas.map((c) => (
                            <option key={c.arquivo} value={c.arquivo}>
                                {c.rotulo}
                            </option>
                        ))}
                    </select>
                </label>

                {municipal && (
                    <label>
                        Colorir por{" "}
                        <select value={modo} onChange={(e) => setModo(e.target.value)}>
                            <option value="regiao">Região imediata</option>
                            <option value="area">Área (km²)</option>
                        </select>
                    </label>
                )}

                <label>
                    Fundo{" "}
                    <select value={base} onChange={(e) => setBase(e.target.value)}>
                        {Object.entries(BASES).map(([chave, b]) => (
                            <option key={chave} value={chave}>
                                {b.rotulo}
                            </option>
                        ))}
                    </select>
                </label>

                <form onSubmit={buscar} className={estilos.busca}>
                    <input
                        list="lista-nomes"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar pelo nome"
                        aria-label="Buscar pelo nome"
                    />
                    <datalist id="lista-nomes">
                        {nomes.map((n) => (
                            <option key={n} value={n} />
                        ))}
                    </datalist>
                    <button type="submit">Ir</button>
                </form>

                {carregando && <span className={estilos.status}>Carregando...</span>}
                {aviso && <span className={estilos.erro}>{aviso}</span>}
                {erro && <span className={estilos.erro}>{erro}</span>}
            </div>

            <div className={estilos.area}>
                <MapContainer ref={mapaRef} center={CENTRO_CEARA} zoom={7} style={{ height: "100%", width: "100%" }}>
                    {BASES[base].camadas(escuro).map((c) => (
                        <TileLayer
                            key={c.url}
                            url={c.url}
                            attribution={c.attribution}
                            maxNativeZoom={c.maxNativeZoom}
                            maxZoom={19}
                        />
                    ))}

                    {dados && (
                        <GeoJSON
                            key={arquivo}
                            data={dados}
                            style={estilo}
                            pointToLayer={(f, latlng) => L.circleMarker(latlng, estiloGenerico(f, escuro))}
                            onEachFeature={aoConfigurarFeicao}
                        />
                    )}
                </MapContainer>

                {municipal && (
                    <div className={estilos.legenda}>
                        {modo === "area" ? (
                            FAIXAS_AREA.map((f) => (
                                <div key={f.rotulo} className={estilos.item}>
                                    <span className={estilos.amostra} style={{ background: f.cor }} />
                                    {f.rotulo}
                                </div>
                            ))
                        ) : (
                            <div>Cor por região imediata ({regioes.length})</div>
                        )}
                        <div className={estilos.nota}>Contorno grosso: Sobral</div>
                    </div>
                )}
            </div>
        </div>
    );
}
