"use client";

import styles from "./page.module.css";

export default function Erro({ error, reset }) {
  return (
    <main className={styles.container}>
      <header className={styles.cabecalho}>
        <h1>Algo deu errado</h1>
        <p>{error?.message || "Não foi possível exibir esta página."}</p>
      </header>
      <button type="button" onClick={() => reset()} className={styles.botao}>
        Tentar de novo
      </button>
    </main>
  );
}
