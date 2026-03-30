# Capilla del Monte — Next.js

App migrada de HTML/CSS puro a Next.js 14 con soporte PWA nativo.

## 🚀 Setup

```bash
npm install
npm run dev
```

## 📁 Estructura

```
capilla-del-monte/
├── app/
│   ├── layout.tsx     ← Meta tags PWA, viewport, fonts
│   ├── page.tsx       ← App completa (lógica + JSX)
│   └── globals.css    ← Todo el CSS original
├── public/
│   ├── manifest.json  ← Manifest PWA
│   ├── icon-192.png   ← ⚠️ Agregar manualmente
│   └── icon-512.png   ← ⚠️ Agregar manualmente
├── next.config.js     ← Config Next.js + PWA
├── tsconfig.json
└── package.json
```

## ⚠️ Antes de hacer deploy

1. Copiá tus íconos a `public/`:
   - `icon-192.png` (192×192 px)
   - `icon-512.png` (512×512 px)

2. Push a GitHub → Vercel detecta Next.js automáticamente

## 🔧 Por qué se solucionó el problema

- El breakpoint del mockup de escritorio cambió de `600px` → `768px`
- El `viewport` ahora lo maneja Next.js con el objeto `Viewport` nativo
- La PWA usa `next-pwa` que genera el service worker correctamente

## 📦 Deploy en Vercel

```bash
# Vercel detecta Next.js automáticamente
# Solo hace falta conectar el repo y hacer deploy
```
