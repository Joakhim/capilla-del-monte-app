"use client";
import "./globals.css";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // All original JS logic
    const FORM_URL =
      "https://docs.google.com/forms/d/e/1FAIpQLScX9lSY_aVwa7CNz2x23tdPNnDYuk6QvlsTE6GNcq4h2U7x2A/viewform";
    const SHEET =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTB-JGfbYK8h-BirV0UlpDoPQEyqQIOA4v7UbZYVOaCDPM05vDI73zOlOgutwUbE9NrfN--LcOi7fGa/pub";
    const GIDS: Record<string, number> = {
      actividades: 0,
      eventos: 160474669,
      gastronomia: 1387579489,
      alojamientos: 912812701,
      salud: 447915446,
    };

    const CAT_CFG: Record<string, { g: string; e: string }> = {
      Trekking: { g: "g1", e: "🥾" },
      Naturaleza: { g: "g2", e: "🌿" },
      Feria: { g: "g3", e: "🛍️" },
      Aventura: { g: "g4", e: "🧗" },
      Espiritual: { g: "g6", e: "🔮" },
      Gastronomía: { g: "g9", e: "🍽️" },
      Alojamiento: { g: "g5", e: "🏨" },
      Salud: { g: "g4", e: "🏥" },
    };

    const CATS = [
      { k: "Todo", e: "🗺️" },
      { k: "Trekking", e: "🥾" },
      { k: "Naturaleza", e: "🌿" },
      { k: "Feria", e: "🛍️" },
      { k: "Aventura", e: "🧗" },
      { k: "Espiritual", e: "🔮" },
      { k: "Gastronomía", e: "🍽️" },
      { k: "Alojamiento", e: "🏨" },
      { k: "Salud", e: "🏥" },
    ];

    let actividades: any[] = [];
    let eventos: any[] = [];
    let currentScreen = "splash";
    let prevScreen = "home";
    let selectedCat = "Todo";
    let filterExplore = "Todo";
    let currentActividad: any = null;
    let favs = new Set<number>();

    function parseCSV(text: string) {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return [];
      const headers = csvSplit(lines[0]);
      return lines
        .slice(1)
        .map((line) => {
          const vals = csvSplit(line);
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => (obj[h] = (vals[i] || "").trim()));
          return obj;
        })
        .filter((r) => Object.values(r).some((v) => v));
    }

    function csvSplit(line: string) {
      const out: string[] = [];
      let cur = "",
        q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (q && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else q = !q;
        } else if (c === "," && !q) {
          out.push(cur.trim());
          cur = "";
        } else cur += c;
      }
      out.push(cur.trim());
      return out;
    }

    async function fetchCSV(gid: number) {
      const r = await fetch(
        `${SHEET}?gid=${gid}&single=true&output=csv`
      );
      if (!r.ok) throw new Error(String(r.status));
      return parseCSV(await r.text());
    }

    function parseFecha(s: string) {
      if (!s) return "";
      s = s.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (m)
        return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
      return "";
    }

    function toNum(s: string) {
      return parseInt((s || "0").replace(/[^0-9]/g, "")) || 0;
    }

    async function cargarTodo() {
      try {
        const [rA, rE, rG, rAl, rS] = await Promise.all([
          fetchCSV(GIDS.actividades),
          fetchCSV(GIDS.eventos),
          fetchCSV(GIDS.gastronomia),
          fetchCSV(GIDS.alojamientos),
          fetchCSV(GIDS.salud),
        ]);

        actividades = [];

        rA
          .filter(
            (r) => r.Nombre && (r.Activo || "Si").toUpperCase() !== "NO"
          )
          .forEach((r, i) => {
            const cat = r.Categoria || "Trekking";
            const cfg = CAT_CFG[cat] || { g: "g1", e: "📍" };
            const costo = toNum(r.Costo);
            actividades.push({
              id: toNum(r.ID) || i + 1,
              nombre: r.Nombre,
              categoria: cat,
              descripcion: r.Descripcion || "",
              costo,
              gratis:
                (r.Gratis || "").toUpperCase() === "SI" || costo === 0,
              duracion: r.Duracion || "Libre",
              dificultad: r.Dificultad || "Media",
              horario: r.Horario || "",
              lat: parseFloat(r.Latitud) || -30.8612,
              lng: parseFloat(r.Longitud) || -64.5241,
              tags: (r.Tags || "")
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean),
              foto: r.Foto || "",
              g: cfg.g,
              e: cfg.e,
              direccion: r.Direccion || "",
              whatsapp: r.Whatsapp || "",
              badge:
                (r.Destacado || "").toUpperCase() === "SI"
                  ? "destacado"
                  : (r.Tags || "").toLowerCase().includes("popular")
                  ? "popular"
                  : costo === 0
                  ? "gratis"
                  : "",
            });
          });

        rG
          .filter(
            (r) => r.Nombre && (r.Activo || "Si").toUpperCase() !== "NO"
          )
          .forEach((r, i) => {
            actividades.push({
              id: 1000 + i,
              nombre: r.Nombre,
              categoria: "Gastronomía",
              descripcion: r.Descripcion || "",
              costo: toNum(r.PrecioPromedio),
              gratis: false,
              duracion: "Libre",
              dificultad: "Baja",
              horario: r.Horario || "",
              lat: parseFloat(r.Latitud) || -30.8612,
              lng: parseFloat(r.Longitud) || -64.5241,
              tags: (r.Tags || "")
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean),
              foto: r.Foto || "",
              g: "g9",
              e: "🍽️",
              direccion: r.Direccion || "",
              badge:
                (r.Destacado || "").toUpperCase() === "SI"
                  ? "destacado"
                  : "",
            });
          });

        const aloEmoji: Record<string, string> = {
          Cabaña: "🏡",
          Hotel: "🏨",
          Hostel: "🛏️",
          Camping: "⛺",
        };

        rAl
          .filter(
            (r) => r.Nombre && (r.Activo || "Si").toUpperCase() !== "NO"
          )
          .forEach((r, i) => {
            actividades.push({
              id: 2000 + i,
              nombre: r.Nombre,
              categoria: "Alojamiento",
              descripcion: r.Descripcion || "",
              costo: toNum(r.PrecioDesde),
              gratis: false,
              duracion: "Por noche",
              dificultad: "Baja",
              horario: "Check-in 14hs",
              lat: parseFloat(r.Latitud) || -30.8612,
              lng: parseFloat(r.Longitud) || -64.5241,
              tags: (r.Servicios || "")
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean),
              foto: r.Foto || "",
              g: "g5",
              e: aloEmoji[r.Tipo] || "🏠",
              telefono: r.Telefono || "",
              whatsapp: r.Whatsapp || "",
              badge:
                (r.Destacado || "").toUpperCase() === "SI"
                  ? "destacado"
                  : "",
            });
          });

        rS
          .filter(
            (r) => r.Nombre && (r.Activo || "Si").toUpperCase() !== "NO"
          )
          .forEach((r, i) => {
            actividades.push({
              id: 3000 + i,
              nombre: r.Nombre,
              categoria: "Salud",
              descripcion: r.Descripcion || "",
              costo: 0,
              gratis: true,
              duracion: r.Horario || "",
              dificultad: "Baja",
              horario: r.Horario || "",
              lat: parseFloat(r.Latitud) || -30.8612,
              lng: parseFloat(r.Longitud) || -64.5241,
              tags: (r.Tags || "")
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean),
              foto: r.Foto || "",
              g: "g4",
              e: "🏥",
              guardia: r.Guardia || "",
              telefono: r.Telefono || "",
              whatsapp: r.Whatsapp || "",
              badge:
                (r.Destacado || "").toUpperCase() === "SI"
                  ? "destacado"
                  : "",
            });
          });

        eventos = rE
          .filter(
            (r) => r.Nombre && (r.Activo || "Si").toUpperCase() !== "NO"
          )
          .map((r, i) => {
            const costo = toNum(r.Costo);
            return {
              id: i,
              nombre: r.Nombre,
              organizador: r.Organizador || "",
              fecha: parseFecha(r.FechaInicio || r.Fecha || ""),
              fechaFin: parseFecha(r.FechaFin || ""),
              horario: r.Horario || "",
              lugar: r.Lugar || "",
              descripcion: r.Descripcion || "",
              telefono: r.Telefono || "",
              costo,
              gratis:
                (r.Gratis || "").toUpperCase() === "SI" || costo === 0,
              tags: (r.Tags || "")
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean),
              foto: r.Foto || "",
              direccion: r.Direccion || "",
              badge:
                (r.Destacado || "").toUpperCase() === "SI"
                  ? "destacado"
                  : "",
            };
          });

        renderHome();
        renderExplore();
        renderEventosFull();
      } catch (e) {
        console.error("Sheet error:", e);
        respaldo();
      }
    }

    function respaldo() {
      actividades = [
        { id: 1, nombre: "Cerro Uritorco", categoria: "Trekking", descripcion: "El pico más alto de las Sierras Chicas con 1.979 msnm.", costo: 5000, gratis: false, duracion: "5-7 hs", dificultad: "Alta", horario: "7:00—13:00", lat: -30.8539, lng: -64.5272, tags: ["trekking", "fotos"], foto: "", g: "g1", e: "🏔️", badge: "popular" },
        { id: 2, nombre: "Cascada Los Manantiales", categoria: "Naturaleza", descripcion: "Cascada serrana ideal para toda la familia.", costo: 0, gratis: true, duracion: "3 hs", dificultad: "Baja", horario: "9:00—18:00", lat: -30.8701, lng: -64.5198, tags: ["agua", "naturaleza"], foto: "", g: "g2", e: "💧", badge: "gratis" },
        { id: 3, nombre: "Feria Artesanal Plaza", categoria: "Feria", descripcion: "Artesanos locales en la plaza principal.", costo: 0, gratis: true, duracion: "Libre", dificultad: "Baja", horario: "18:00—24:00", lat: -30.8612, lng: -64.5241, tags: ["feria", "compras"], foto: "", g: "g3", e: "🛍️", badge: "hoy" },
      ];
      eventos = [
        { id: 0, nombre: "Show de Folklore", fecha: "2026-03-05", horario: "21:00", lugar: "Bar El Cerro", costo: 3500, gratis: false, tags: [] },
        { id: 1, nombre: "Feria de Luna Llena", fecha: "2026-03-05", horario: "19:00", lugar: "Plaza San Martín", costo: 0, gratis: true, tags: [] },
      ];
      renderHome();
      renderExplore();
      renderEventosFull();
    }

    async function cargarClima() {
      try {
        const r = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-30.8612&longitude=-64.5241&current=temperature_2m,weathercode&timezone=America/Argentina/Cordoba"
        );
        const d = await r.json();
        const { emoji, desc } = climaDesc(d.current.weathercode);
        const ci = document.getElementById("climaIcon");
        const ct = document.getElementById("climaText");
        if (ci) ci.textContent = emoji;
        if (ct) ct.textContent = `${Math.round(d.current.temperature_2m)}°C · ${desc}`;
      } catch (e) {
        const ct = document.getElementById("climaText");
        if (ct) ct.textContent = "Capilla del Monte";
      }
    }

    function climaDesc(c: number) {
      if (c === 0) return { emoji: "☀️", desc: "Cielo despejado" };
      if (c === 1) return { emoji: "🌤️", desc: "Mayormente despejado" };
      if (c === 2) return { emoji: "⛅", desc: "Parcialmente nublado" };
      if (c === 3) return { emoji: "☁️", desc: "Nublado" };
      if (c === 45 || c === 48) return { emoji: "🌫️", desc: "Niebla" };
      if (c >= 51 && c <= 55) return { emoji: "🌦️", desc: "Llovizna" };
      if (c >= 61 && c <= 65) return { emoji: "🌧️", desc: "Lluvia" };
      if (c >= 71 && c <= 77) return { emoji: "❄️", desc: "Nieve" };
      if (c >= 80 && c <= 82) return { emoji: "🌦️", desc: "Llovizna" };
      if (c >= 85 && c <= 86) return { emoji: "🌨️", desc: "Nevada" };
      if (c >= 95 && c <= 99) return { emoji: "⛈️", desc: "Tormenta" };
      return { emoji: "🌤️", desc: "Variable" };
    }

    function goTo(s: string) {
      if (s === currentScreen) return;
      const cur = document.getElementById(currentScreen);
      const nxt = document.getElementById(s);
      if (!cur || !nxt) return;
      prevScreen = currentScreen;
      cur.classList.add("back");
      nxt.classList.remove("hidden", "back");
      setTimeout(() => {
        cur.classList.add("hidden");
        cur.classList.remove("back");
      }, 380);
      currentScreen = s;
      if (s === "home") renderHome();
      if (s === "explore") renderExplore();
      if (s === "favoritos") renderFavoritos();
      if (s === "eventos") renderEventosFull();
    }

    function goBack() {
      goTo(prevScreen === currentScreen ? "home" : prevScreen);
    }

    function imgTag(foto: string, cls: string) {
      return foto && foto.startsWith("http")
        ? `<img class="${cls}" src="${foto}" loading="lazy" onerror="this.remove()">`
        : "";
    }

    function renderHome() {
      const h = new Date().getHours();
      const greetEl = document.getElementById("greeting");
      if (greetEl)
        greetEl.innerHTML = `${h < 12 ? "¡Buenos días!" : h < 19 ? "¡Buenas tardes!" : "¡Buenas noches!"}<br>¿Qué hacemos hoy?`;
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
      const n = new Date();
      const hdateEl = document.getElementById("hdate");
      if (hdateEl) hdateEl.textContent = `${dias[n.getDay()]} ${n.getDate()} de ${meses[n.getMonth()]} · ${actividades.length} actividades`;

      const catsEl = document.getElementById("catsList");
      if (catsEl)
        catsEl.innerHTML = CATS.map(
          (c) => `<div class="cat${selectedCat === c.k ? " on" : ""}" onclick="window._selectCat('${c.k}')"><span class="cat-ico">${c.e}</span><span class="cat-lbl">${c.k}</span></div>`
        ).join("");

      const todos = selectedCat === "Todo" ? actividades : actividades.filter((a) => a.categoria === selectedCat);
      const destacados = todos.filter((a) => a.badge === "destacado");
      const resto = todos.filter((a) => a.badge !== "destacado");

      const destEl = document.getElementById("destacadosList");
      if (destEl)
        destEl.innerHTML = destacados
          .map(
            (a) => `<div class="acard" onclick="window._openDetalle(${a.id})">
            <div class="aimg"><div class="aimg-bg ${a.g}">${imgTag(a.foto, "aimg-photo")}<span class="aimg-emoji">${a.e}</span></div><div class="abadge destacado">⭐ Destacado</div></div>
            <div class="abody"><div class="aname">${a.nombre}</div><div class="ameta">⏱ ${a.duracion}${a.horario ? " · " + a.horario : ""}</div><div class="tags">${a.tags.slice(0, 2).map((t: string) => `<span class="tag">${t}</span>`).join("")}</div></div>
          </div>`
          )
          .join("");

      const restoEl = document.getElementById("restoDeLista");
      if (restoEl)
        restoEl.innerHTML =
          selectedCat !== "Todo" && resto.length
            ? `<div style="font-size:var(--fs-xs);font-weight:700;color:var(--g);text-transform:uppercase;letter-spacing:1px;padding:8px 0 10px">También disponible</div>
          ${resto.slice(0, 5).map((a: any) => `
            <div onclick="window._openDetalle(${a.id})" style="display:flex;align-items:center;gap:10px;background:#fff;border-radius:12px;padding:9px 11px;margin-bottom:7px;box-shadow:0 2px 6px rgba(0,0,0,.07);cursor:pointer">
              <div class="${a.g}" style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative;overflow:hidden">${imgTag(a.foto, "aimg-photo")}<span style="position:relative;z-index:2">${a.e}</span></div>
              <div style="flex:1;min-width:0"><div style="font-size:var(--fs-sm);font-weight:600;color:var(--n);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.nombre}</div><div style="font-size:var(--fs-xs);color:var(--g)">${a.gratis ? "Gratis" : "$" + a.costo.toLocaleString()} · ${a.horario || a.categoria}</div></div>
              <span style="color:var(--g);font-size:14px">›</span>
            </div>`).join("")}
          ${resto.length > 5 ? `<div onclick="window._goTo('explore')" style="text-align:center;padding:10px;font-size:var(--fs-sm);font-weight:700;color:var(--v);cursor:pointer">Ver todos (${resto.length}) →</div>` : ""}`
            : "";

      const hoy = new Date().toISOString().slice(0, 10);
      const evs = eventos.filter((e) => e.fecha === hoy).slice(0, 3);
      const vc = ["c0", "c1", "c2"];
      const evListEl = document.getElementById("eventosList");
      if (evListEl)
        evListEl.innerHTML = evs.length
          ? evs
              .map((e, i) => {
                const fd = new Date(e.fecha + "T12:00:00");
                const dd = isNaN(fd.getTime()) ? "?" : fd.getDate();
                const mm = isNaN(fd.getTime()) ? "???" : fd.toLocaleString("es", { month: "short" }).toUpperCase().slice(0, 3);
                return `<div class="evrow" onclick="window._openEvento(${e.id})"><div class="evfecha ${vc[i]}"><div class="evfecha-d">${dd}</div><div class="evfecha-m">${mm}</div></div><div class="evinfo"><div class="evname">${e.nombre}</div><div class="evdet">🕗 ${e.horario} · ${e.lugar}</div></div><div class="evp${e.gratis ? " free" : ""}">${e.gratis ? "Gratis" : "$" + e.costo.toLocaleString()}</div></div>`;
              })
              .join("")
          : `<p style="padding:8px var(--sp-sm) 14px;font-size:var(--fs-sm);color:var(--g)">No hay eventos — ¡sé el primero en sumar uno!</p>`;
    }

    function te(t: string) {
      const m: Record<string, string> = { trekking: "🥾", fotos: "📸", naturaleza: "🌿", energía: "🔮", agua: "💧", familia: "👨‍👩‍👧", feria: "🛍️", compras: "🛍️", comida: "🍽️", aventura: "🧗", adrenalina: "⚡", guiado: "👥", espiritual: "🧘", parrilla: "🍖", café: "☕", bar: "🍻", vegano: "🥗", hotel: "🏨", cabaña: "🏡", hostel: "🛏️", camping: "⛺", salud: "🏥", farmacia: "💊", guardia: "🚨", wifi: "📶", pileta: "🏊", desayuno: "🍳", música: "🎵", noche: "🌙", río: "💧", asadores: "🔥", estacionamiento: "🚗", popular: "⭐", vista: "👀" };
      return m[t.toLowerCase()] || "✨";
    }

    function servicioIco(s: string) {
      const m: Record<string, string> = { pileta: "🏊", piscina: "🏊", wifi: "📶", "wi-fi": "📶", desayuno: "🍳", estacionamiento: "🚗", parking: "🚗", tv: "📺", aire: "❄️", cabaña: "🏡", jardín: "🌿", parrilla: "🔥", mascotas: "🐾", fogón: "🔥", quincho: "🏕️", vista: "👀", cerros: "⛰️" };
      const k = s.toLowerCase().trim();
      return (Object.entries(m).find(([key]) => k.includes(key)) || ["", "✨"])[1];
    }

    function renderExplore(filter?: string) {
      if (filter !== undefined) filterExplore = filter;
      const fil = (filterExplore === "Todo" ? actividades : actividades.filter((a) => a.categoria === filterExplore)).sort((a: any, b: any) => (b.badge === "destacado" ? 1 : 0) - (a.badge === "destacado" ? 1 : 0));
      const countEl = document.getElementById("exploreCount");
      if (countEl) countEl.textContent = `${fil.length} lugar${fil.length !== 1 ? "es" : ""} disponibles`;
      const flEl = document.getElementById("filtersList");
      if (flEl) flEl.innerHTML = ["Todo", ...new Set(actividades.map((a: any) => a.categoria))].map((c) => `<div class="chip${filterExplore === c ? " on" : ""}" onclick="window._renderExplore('${c}')">${c}</div>`).join("");
      const gridEl = document.getElementById("exploreGrid");
      if (gridEl)
        gridEl.innerHTML = fil
          .map(
            (a: any, i: number) => `<div class="ecard${i === 0 ? " feat" : ""}" onclick="window._openDetalle(${a.id})">
            <div class="ecimg"><div class="ecimg-bg ${a.g}">${imgTag(a.foto, "ecimg-photo")}<span class="ecimg-emoji">${a.e}</span></div>${a.badge ? `<div class="ebadge" style="background:${a.badge === "gratis" ? "#1565C0" : a.badge === "hoy" ? "var(--t)" : "var(--vl)"}">${a.badge.toUpperCase()}</div>` : ""}</div>
            <div class="ecbody"><div class="ecname">${a.nombre}</div><div class="ecmeta">${te(a.tags[0] || "")} ${a.categoria} · ${a.gratis ? "Gratis" : "$" + a.costo.toLocaleString()}</div></div>
          </div>`
          )
          .join("");
    }

    function renderEventosFull() {
      const hoy = new Date().toISOString().slice(0, 10);
      const prox = eventos.filter((e) => e.fecha && e.fecha >= hoy).sort((a: any, b: any) => a.fecha.localeCompare(b.fecha));
      const subEl = document.getElementById("eventosSub");
      if (subEl) subEl.textContent = `${prox.length} evento${prox.length !== 1 ? "s" : ""} próximos`;
      const cols = ["c0", "c1", "c2", "c3", "c4"];
      const listEl = document.getElementById("eventosListFull");
      if (listEl)
        listEl.innerHTML = prox.length
          ? `<div class="ev-sec">Próximos eventos</div>` +
            prox
              .map((e: any, i: number) => {
                const fd = new Date(e.fecha + "T12:00:00");
                const dd = isNaN(fd.getTime()) ? "?" : fd.getDate();
                const mm = isNaN(fd.getTime()) ? "???" : fd.toLocaleString("es", { month: "short" }).toUpperCase().slice(0, 3);
                return `<div class="ev-card" onclick="window._openEvento(${e.id})" style="cursor:pointer"><div class="ev-datebox ${cols[i % 5]}"><div class="ev-dd">${dd}</div><div class="ev-mm">${mm}</div></div><div class="ev-info"><div class="ev-name">${e.nombre}</div><div class="ev-detail">🕗 ${e.horario} · ${e.lugar}</div><div class="ev-price${e.gratis ? " free" : ""}">${e.gratis ? "Gratis" : "$" + e.costo.toLocaleString()}</div></div></div>`;
              })
              .join("")
          : `<p style="padding:30px;text-align:center;color:var(--g);font-size:var(--fs-sm)">No hay eventos próximos.<br>¡Sé el primero en sumar uno! 🎪</p>`;
    }

    function renderFavoritos() {
      const cnt = favs.size;
      const favCountEl = document.getElementById("favCount");
      if (favCountEl) favCountEl.textContent = `${cnt} lugar${cnt !== 1 ? "es" : ""} guardado${cnt !== 1 ? "s" : ""}`;
      const c = document.getElementById("favContent");
      if (!c) return;
      if (!cnt) {
        c.className = "fav-empty";
        c.innerHTML = `<div class="fav-empty-ico">🗺️</div><div class="fav-empty-title">Todavía no guardaste nada</div><div class="fav-empty-sub">Explorá las actividades y tocá el ❤️ para guardar tus favoritos</div><button class="fav-btn" onclick="window._goTo('explore')">Explorar actividades</button>`;
      } else {
        c.className = "fav-list";
        c.innerHTML = actividades
          .filter((a) => favs.has(a.id))
          .map(
            (a) => `<div class="fav-card" onclick="window._openDetalle(${a.id})">
            <div class="fav-cimg"><div class="fav-cimg-bg ${a.g}"></div>${imgTag(a.foto, "fav-cimg-photo")}<span class="fav-cimg-emoji">${a.e}</span></div>
            <div class="fav-card-body"><div class="fav-card-name">${a.nombre}</div><div class="fav-card-meta">⏱ ${a.duracion}${a.horario ? " · " + a.horario : ""}</div><span class="fav-card-tag">${a.categoria}</span></div>
            <div class="fav-remove" onclick="event.stopPropagation();window._removeFav(${a.id})">🗑️</div>
          </div>`
          )
          .join("");
      }
    }

    function toggleFav() {
      if (!currentActividad) return;
      favs.has(currentActividad.id) ? favs.delete(currentActividad.id) : favs.add(currentActividad.id);
      const fb = document.getElementById("favBtn");
      if (fb) fb.textContent = favs.has(currentActividad.id) ? "❤️" : "🤍";
      showToast(favs.has(currentActividad.id) ? "¡Guardado! ❤️" : "Eliminado de guardados");
    }

    function filterActividades() {
      const input = document.getElementById("searchInput") as HTMLInputElement;
      const q = input?.value.toLowerCase() || "";
      if (!q) { renderHome(); return; }
      const f = actividades.filter((a) => a.nombre.toLowerCase().includes(q) || a.categoria.toLowerCase().includes(q) || a.tags.some((t: string) => t.toLowerCase().includes(q)));
      const destEl = document.getElementById("destacadosList");
      if (destEl)
        destEl.innerHTML = f.length
          ? f.map((a) => `<div class="acard" onclick="window._openDetalle(${a.id})"><div class="aimg"><div class="aimg-bg ${a.g}">${imgTag(a.foto, "aimg-photo")}<span class="aimg-emoji">${a.e}</span></div></div><div class="abody"><div class="aname">${a.nombre}</div><div class="ameta">⏱ ${a.duracion}</div><div class="tags">${a.tags.slice(0, 2).map((t: string) => `<span class="tag">${t}</span>`).join("")}</div></div></div>`).join("")
          : '<p style="padding:20px;color:var(--g);font-size:var(--fs-sm);text-align:center">Sin resultados 🔍</p>';
    }

    function openEvento(id: number) {
      const e = eventos.find((ev) => ev.id === id);
      if (!e) return;
      const fd = new Date(e.fecha + "T12:00:00");
      const fechaStr = isNaN(fd.getTime()) ? e.fecha : fd.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });
      const hero = document.getElementById("detailHero");
      if (!hero) return;
      hero.className = "dhero g6";
      hero.innerHTML = `<div class="dhero-bg g6">${imgTag(e.foto, "dhero-photo")}<span class="dhero-emoji">🎪</span></div><div class="dbk" onclick="window._goBack()">←</div><div class="dpht"><div class="pd on"></div><div class="pd"></div></div>`;
      const body = document.getElementById("detailBody");
      if (body)
        body.innerHTML = `<div class="dtr"><div class="dtit">${e.nombre}</div></div>
        <div class="dloc">📍 ${e.lugar || "Capilla del Monte"}</div>
        <div class="dtags">${e.tags.map((t: string) => `<div class="dtag">${te(t)} ${t}</div>`).join("")}</div>
        <div class="igrid">
          <div class="icard"><div class="iico">📅</div><div class="ilbl">Fecha</div><div class="ival" style="font-size:var(--fs-xs)">${fechaStr}</div></div>
          <div class="icard"><div class="iico">🕗</div><div class="ilbl">Horario</div><div class="ival">${e.horario || "—"}</div></div>
          <div class="icard"><div class="iico">💰</div><div class="ilbl">Costo</div><div class="ival">${e.gratis ? "Gratis" : "$" + e.costo.toLocaleString()}</div></div>
          <div class="icard"><div class="iico">👤</div><div class="ilbl">Organizador</div><div class="ival" style="font-size:var(--fs-xs)">${e.organizador || "—"}</div></div>
        </div>
        <div class="dsec">Sobre el evento</div>
        <div class="ddesc">${e.descripcion || "Sin descripción disponible."}</div>
        <div class="dsec">Ubicación</div>
        <div class="mmap" style="padding:0;overflow:hidden" onclick="window._openMaps(${e.lat || "-30.8612"},${e.lng || "-64.5241"})">
          <iframe width="100%" height="100%" frameborder="0" style="border:0;pointer-events:none" src="https://maps.google.com/maps?q=${e.lugar || "Capilla+del+Monte"}&z=15&output=embed"></iframe>
          <div style="position:absolute;inset:0;z-index:2"></div>
        </div>
        ${e.telefono ? `<button class="dcta" style="background:#25D366;box-shadow:0 8px 20px rgba(37,211,102,.3)" onclick="window._abrirWsp('${e.telefono}')">📲 Contactar por WhatsApp</button>` : ""}
        <button class="dcta2" onclick="window._showToast('¡Compartido!')">📤 Compartir</button>`;
      goTo("detail");
    }

    function openDetalle(id: number) {
      currentActividad = actividades.find((a) => a.id === id);
      if (!currentActividad) return;
      const a = currentActividad;
      const hero = document.getElementById("detailHero");
      if (!hero) return;
      hero.className = "dhero " + a.g;
      hero.innerHTML = `<div class="dhero-bg ${a.g}">${imgTag(a.foto, "dhero-photo")}<span class="dhero-emoji">${a.e}</span></div><div class="dbk" onclick="window._goBack()">←</div><div class="dfv" id="favBtn" onclick="window._toggleFav()">${favs.has(a.id) ? "❤️" : "🤍"}</div><div class="dpht"><div class="pd on"></div><div class="pd"></div><div class="pd"></div></div>`;
      const dc = a.dificultad === "Alta" ? "alta" : a.dificultad === "Media" ? "media" : "baja";
      const body = document.getElementById("detailBody");
      if (!body) return;

      if (a.categoria === "Alojamiento") {
        body.innerHTML = `<div class="dtr"><div class="dtit">${a.nombre}</div><div class="drat">⭐ 4.8</div></div>
          <div class="dloc">📍 Capilla del Monte · ${a.categoria}</div>
          <div class="dtags">${a.tags.map((t: string) => `<div class="dtag">${servicioIco(t)} ${t}</div>`).join("")}</div>
          <div class="igrid">
            <div class="icard"><div class="iico">🕖</div><div class="ilbl">Check-in</div><div class="ival">${a.horario || "14hs"}</div></div>
            <div class="icard"><div class="iico">📞</div><div class="ilbl">Teléfono</div><div class="ival">${a.telefono || "—"}</div></div>
          </div>
          <div class="dsec">Sobre el alojamiento</div>
          <div class="ddesc">${a.descripcion || "Sin descripción disponible."}</div>
          <div class="dsec">Ubicación</div>
          <div class="mmap" style="padding:0;overflow:hidden" onclick="window._openMaps(${a.lat},${a.lng})">
            <iframe width="100%" height="100%" frameborder="0" style="border:0;pointer-events:none" src="https://maps.google.com/maps?q=${a.lat},${a.lng}&z=16&output=embed"></iframe>
            <div style="position:absolute;inset:0;z-index:2" onclick="window._openMaps(${a.lat},${a.lng})"></div>
          </div>
          ${a.whatsapp ? `<button class="dcta" style="background:#25D366;box-shadow:0 8px 20px rgba(37,211,102,.3)" onclick="window._abrirWsp('${a.whatsapp}')">📲 Contactar por WhatsApp</button>` : ""}
          <button class="dcta2" onclick="window._openMaps(${a.lat},${a.lng})">🗺️ Cómo llegar</button>
          <button class="dcta2" onclick="window._showToast('¡Compartido!')">📤 Compartir</button>`;
        goTo("detail");
        return;
      }

      if (a.categoria === "Salud") {
        body.innerHTML = `<div class="dtr"><div class="dtit">${a.nombre}</div><div class="drat">⭐ 4.8</div></div>
          <div class="dloc">📍 ${a.descripcion || "Capilla del Monte"}</div>
          <div class="dtags">${a.tags.map((t: string) => `<div class="dtag">${te(t)} ${t}</div>`).join("")}</div>
          <div class="igrid">
            <div class="icard"><div class="iico">🕖</div><div class="ilbl">Horario</div><div class="ival">${a.horario || "—"}</div></div>
            <div class="icard"><div class="iico">🚑</div><div class="ilbl">Guardia</div><div class="ival">${a.guardia || "—"}</div></div>
            <div class="icard"><div class="iico">📞</div><div class="ilbl">Teléfono</div><div class="ival">${a.telefono || "—"}</div></div>
            <div class="icard"><div class="iico">📍</div><div class="ilbl">Dirección</div><div class="ival">${a.descripcion || "—"}</div></div>
          </div>
          <div class="dsec">Ubicación</div>
          <div class="mmap" style="padding:0;overflow:hidden" onclick="window._openMaps(${a.lat},${a.lng})">
            <iframe width="100%" height="100%" frameborder="0" style="border:0;pointer-events:none" src="https://maps.google.com/maps?q=${a.lat},${a.lng}&z=16&output=embed"></iframe>
            <div style="position:absolute;inset:0;z-index:2" onclick="window._openMaps(${a.lat},${a.lng})"></div>
          </div>
          <button class="dcta" style="background:#25D366;box-shadow:0 8px 20px rgba(37,211,102,.3)" onclick="window._abrirWsp('${a.whatsapp}')">📲 Contactar por WhatsApp</button>
          <button class="dcta2" onclick="window._openMaps(${a.lat},${a.lng})">🗺️ Cómo llegar</button>
          <button class="dcta2" onclick="window._showToast('¡Enlace copiado!')">📤 Compartir</button>`;
        goTo("detail");
        return;
      }

      body.innerHTML = `<div class="dtr"><div class="dtit">${a.nombre}</div><div class="drat">⭐ 4.8</div></div>
        <div class="dloc">📍 Capilla del Monte · ${a.categoria}</div>
        <div class="dtags">${a.tags.map((t: string) => `<div class="dtag">${te(t)} ${t}</div>`).join("")}</div>
        <div class="igrid">
          <div class="icard"><div class="iico">🕖</div><div class="ilbl">Horario</div><div class="ival">${a.horario || "—"}</div></div>
          ${a.categoria === "Gastronomía" || a.categoria === "Feria" || a.categoria === "Espiritual"
            ? `<div class="icard"><div class="iico">📍</div><div class="ilbl">Dirección</div><div class="ival">${a.direccion || "—"}</div></div>`
            : `<div class="icard"><div class="iico">💰</div><div class="ilbl">Costo</div><div class="ival">${a.gratis ? "Gratis" : "$" + a.costo.toLocaleString()}</div></div>`}
          <div class="icard"><div class="iico">⏱️</div><div class="ilbl">Duración</div><div class="ival">${a.duracion}</div></div>
          ${a.categoria !== "Gastronomía" && a.categoria !== "Feria" && a.categoria !== "Espiritual"
            ? `<div class="icard"><div class="iico">💪</div><div class="ilbl">Dificultad</div><div class="ival ${dc}">${a.dificultad}</div></div>`
            : ""}
        </div>
        <div class="dsec">Sobre este lugar</div>
        <div class="ddesc">${a.descripcion || "Sin descripción disponible."}</div>
        <div class="dsec">Cómo llegar</div>
        <div class="mmap" style="padding:0;overflow:hidden" onclick="window._openMaps(${a.lat},${a.lng})">
          <iframe width="100%" height="100%" frameborder="0" style="border:0;pointer-events:none" src="https://maps.google.com/maps?q=${a.lat},${a.lng}&z=16&output=embed"></iframe>
          <div style="position:absolute;inset:0;z-index:2" onclick="window._openMaps(${a.lat},${a.lng})"></div>
        </div>
        ${a.whatsapp ? `<button class="dcta" style="background:#25D366;box-shadow:0 8px 20px rgba(37,211,102,.3)" onclick="window._abrirWsp('${a.whatsapp}')">📲 Contactar por WhatsApp</button>` : ""}
        <button class="dcta" onclick="window._openMaps(${a.lat},${a.lng})">🗺️ Cómo llegar</button>
        <button class="dcta2" onclick="window._showToast('¡Compartido!')">📤 Compartir</button>`;
      goTo("detail");
    }

    function abrirWsp(num: string) {
      if (num) window.open("https://wa.me/54" + num, "_blank");
      else showToast("Sin WhatsApp cargado");
    }

    function openMaps(lat: number, lng: number) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }

    function showToast(msg: string) {
      const t = document.getElementById("toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 2200);
    }

    function mostrarDona() {
      const p = document.getElementById("donaPopup");
      if (p) p.style.display = "flex";
    }

    function cerrarDona() {
      const p = document.getElementById("donaPopup");
      if (p) p.style.display = "none";
    }

    async function iniciar() {
      goTo("home");
      cargarClima();
      await cargarTodo();
      setTimeout(mostrarDona, 60000);
    }

    // Expose functions to window for inline HTML handlers
    (window as any)._goTo = goTo;
    (window as any)._goBack = goBack;
    (window as any)._openDetalle = openDetalle;
    (window as any)._openEvento = openEvento;
    (window as any)._selectCat = (c: string) => { selectedCat = c; renderHome(); };
    (window as any)._renderExplore = renderExplore;
    (window as any)._toggleFav = toggleFav;
    (window as any)._removeFav = (id: number) => { favs.delete(id); renderFavoritos(); showToast("Eliminado de guardados"); };
    (window as any)._abrirWsp = abrirWsp;
    (window as any)._openMaps = openMaps;
    (window as any)._showToast = showToast;
    (window as any)._abrirFormulario = () => window.open(FORM_URL, "_blank");
    (window as any)._mostrarDona = mostrarDona;
    (window as any)._cerrarDona = cerrarDona;
    (window as any)._filterActividades = filterActividades;
    (window as any)._iniciar = iniciar;
  }, []);

  return (
    <div id="app">
      {/* SPLASH */}
      <div className="screen" id="splash">
        <div className="sp-bg"></div>
        <svg className="sp-mtn" viewBox="0 0 390 280" fill="none">
          <path d="M0 280 L80 140 L135 185 L205 75 L270 148 L320 98 L390 155 L390 280Z" fill="white" />
          <path d="M0 280 L60 205 L120 240 L190 160 L250 208 L298 168 L390 215 L390 280Z" fill="white" opacity="0.4" />
        </svg>
        <div className="sp-content">
          <div className="sp-ico">🏔️</div>
          <div className="sp-title">Capilla<br />del Monte</div>
          <div className="sp-sub">Córdoba · Argentina</div>
          <div className="sp-tag">Descubrí todo lo que podés hacer hoy en la ciudad</div>
          <button className="sp-btn" onClick={() => (window as any)._iniciar()}>Explorar ahora →</button>
          <div className="sp-dots">
            <div className="sd on"></div>
            <div className="sd"></div>
            <div className="sd"></div>
          </div>
        </div>
      </div>

      {/* HOME */}
      <div className="screen hidden" id="home">
        <div className="hdr">
          <div className="hdr-top">
            <div className="hloc">📍 Capilla del Monte</div>
            <div className="hav" onClick={() => (window as any)._mostrarDona()}>🤝</div>
          </div>
          <div className="hgreet" id="greeting"></div>
          <div className="hdate" id="hdate"></div>
          <div className="wpill">
            <span id="climaIcon">🌤️</span>
            <span id="climaText">Cargando clima...</span>
          </div>
        </div>
        <div className="srch">
          <span style={{ fontSize: "16px", flexShrink: 0 }}>🔍</span>
          <input type="text" placeholder="Buscar actividades..." id="searchInput" onInput={() => (window as any)._filterActividades()} />
        </div>
        <div className="scroll-area">
          <div className="sec-hdr"><div className="sec-t">Categorías</div></div>
          <div className="cats" id="catsList"></div>
          <div className="sec-hdr">
            <div className="sec-t">Recomendados</div>
            <div className="ver" onClick={() => (window as any)._goTo("explore")}>Ver todos</div>
          </div>
          <div className="hscr" id="destacadosList"></div>
          <div id="restoDeLista" style={{ padding: "0 var(--sp-sm) 6px" }}></div>
          <div className="sec-hdr">
            <div className="sec-t">Eventos hoy</div>
            <div className="ver" onClick={() => (window as any)._goTo("eventos")}>Ver más</div>
          </div>
          <div id="eventosList"></div>
          <div className="banner-evento" onClick={() => (window as any)._abrirFormulario()}>
            <div className="banner-ico">🎪</div>
            <div className="banner-txt">
              <div className="banner-titulo">¿Tenés un evento?</div>
              <div className="banner-sub">Sumalo gratis y llegá a todos los turistas</div>
            </div>
            <div className="banner-arrow">→</div>
          </div>
        </div>
        <div className="navbar">
          <div className="ni on" onClick={() => (window as any)._goTo("home")}><span className="ni-ico">🏠</span><span className="ni-lbl">Inicio</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("explore")}><span className="ni-ico">🗺️</span><span className="ni-lbl">Explorar</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("eventos")}><span className="ni-ico">📅<span className="ndot"></span></span><span className="ni-lbl">Eventos</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("favoritos")}><span className="ni-ico">❤️</span><span className="ni-lbl">Guardados</span></div>
        </div>
      </div>

      {/* DETALLE */}
      <div className="screen hidden" id="detail">
        <div className="dhero" id="detailHero"></div>
        <div className="dbody" id="detailBody"></div>
      </div>

      {/* EXPLORAR */}
      <div className="screen hidden" id="explore">
        <div className="exhdr">
          <div className="extit">Explorá<br />Capilla 🗺️</div>
          <div className="exsub" id="exploreCount"></div>
        </div>
        <div className="fltrs" id="filtersList"></div>
        <div className="scroll-area" style={{ paddingBottom: 0 }}>
          <div className="expgrid" id="exploreGrid"></div>
        </div>
        <div className="navbar">
          <div className="ni" onClick={() => (window as any)._goTo("home")}><span className="ni-ico">🏠</span><span className="ni-lbl">Inicio</span></div>
          <div className="ni on" onClick={() => (window as any)._goTo("explore")}><span className="ni-ico">🗺️</span><span className="ni-lbl">Explorar</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("eventos")}><span className="ni-ico">📅<span className="ndot"></span></span><span className="ni-lbl">Eventos</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("favoritos")}><span className="ni-ico">❤️</span><span className="ni-lbl">Guardados</span></div>
        </div>
      </div>

      {/* EVENTOS */}
      <div className="screen hidden" id="eventos">
        <div className="ev-hdr">
          <div className="hdr-top" style={{ position: "relative", zIndex: 1 }}>
            <div className="hloc">📅 Agenda</div>
            <div className="hav" onClick={() => (window as any)._goBack()}>←</div>
          </div>
          <div className="ev-title">Eventos en Capilla</div>
          <div className="ev-sub" id="eventosSub">Cargando...</div>
        </div>
        <div className="ev-banner" onClick={() => (window as any)._abrirFormulario()}>
          <div className="ev-banner-title">¿Organizás un evento?</div>
          <div className="ev-banner-sub">Sumalo gratis y llegá a cientos de turistas</div>
          <div className="ev-banner-btn">➕ Sumar mi evento</div>
        </div>
        <div className="ev-list" id="eventosListFull"></div>
        <div className="navbar">
          <div className="ni" onClick={() => (window as any)._goTo("home")}><span className="ni-ico">🏠</span><span className="ni-lbl">Inicio</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("explore")}><span className="ni-ico">🗺️</span><span className="ni-lbl">Explorar</span></div>
          <div className="ni on" onClick={() => (window as any)._goTo("eventos")}><span className="ni-ico">📅</span><span className="ni-lbl">Eventos</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("favoritos")}><span className="ni-ico">❤️</span><span className="ni-lbl">Guardados</span></div>
        </div>
      </div>

      {/* FAVORITOS */}
      <div className="screen hidden" id="favoritos">
        <div className="fav-hdr">
          <div className="hdr-top" style={{ position: "relative", zIndex: 1 }}>
            <div className="hloc">❤️ Guardados</div>
            <div className="hav" onClick={() => (window as any)._goBack()}>←</div>
          </div>
          <div className="fav-title">Tus lugares<br />guardados</div>
          <div className="fav-sub" id="favCount">0 lugares guardados</div>
        </div>
        <div id="favContent"></div>
        <div className="navbar">
          <div className="ni" onClick={() => (window as any)._goTo("home")}><span className="ni-ico">🏠</span><span className="ni-lbl">Inicio</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("explore")}><span className="ni-ico">🗺️</span><span className="ni-lbl">Explorar</span></div>
          <div className="ni" onClick={() => (window as any)._goTo("eventos")}><span className="ni-ico">📅<span className="ndot"></span></span><span className="ni-lbl">Eventos</span></div>
          <div className="ni on" onClick={() => (window as any)._goTo("favoritos")}><span className="ni-ico">❤️</span><span className="ni-lbl">Guardados</span></div>
        </div>
      </div>

      {/* DONA POPUP */}
      <div id="donaPopup" style={{ display: "none", position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: "28px 28px 0 0", padding: "28px 24px 36px", width: "100%", maxWidth: "430px" }}>
          <div style={{ textAlign: "center", fontSize: "36px", marginBottom: "8px" }}>❤️</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "20px", fontWeight: 700, color: "#1A1A2E", textAlign: "center", marginBottom: "10px" }}>Hecho con amor para Capilla</div>
          <div style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, textAlign: "center", marginBottom: "20px" }}>
            Esta app es un proyecto independiente y sin fines de lucro para ayudar a turistas y locales a descubrir todo lo que tiene Capilla del Monte.<br /><br />
            Si te fue útil, cualquier colaboración nos ayuda a mantenerla viva 🙏
          </div>
          <div style={{ background: "#F5F0E8", borderRadius: "14px", padding: "14px", marginBottom: "18px", fontSize: "13px", color: "#1A1A2E", lineHeight: 2 }}>
            📧 hola@capilladigital.com<br />
            💬 <a href="https://wa.me/541139018202" style={{ color: "#2D6A4F", fontWeight: 600 }}>WhatsApp: 11 3901-8202</a><br />
            💙 Alias MP: <strong>capilladigital.mp</strong>
          </div>
          <button onClick={() => (window as any)._cerrarDona()} style={{ width: "100%", background: "#2D6A4F", color: "#fff", border: "none", padding: "15px", borderRadius: "14px", fontFamily: "'DM Sans',sans-serif", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: "10px" }}>¡Con gusto colaboro! 🙌</button>
          <button onClick={() => (window as any)._cerrarDona()} style={{ width: "100%", background: "transparent", color: "#6B7280", border: "none", padding: "10px", fontFamily: "'DM Sans',sans-serif", fontSize: "13px", cursor: "pointer" }}>Ahora no, gracias</button>
        </div>
      </div>

      <div className="toast" id="toast"></div>
    </div>
  );
}
