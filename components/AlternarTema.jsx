"use client";

import { definirTema, useTema } from "@/lib/tema";
import styles from "@/app/page.module.css";

export default function AlternarTema() {
    const tema = useTema();
    const proximo = tema === "dark" ? "light" : "dark";

    return (
        <button type="button" className={styles.botao} onClick={() => definirTema(proximo)}>
            {tema === "dark" ? "Tema claro" : "Tema escuro"}
        </button>
    );
}
