# Restaurant POS — Point of Sale System for Restaurants (Next.js + Supabase)

A modern **restaurant point-of-sale (POS) system** built with **Next.js 15**, **React 19**, and **Supabase**. Restaurant POS streamlines daily operations — order management, inventory tracking, QR-code table ordering, and printable PDF receipts — with real-time sales analytics in a fast, beautiful interface.

## Features

- **Order management** — create and manage restaurant orders from a purpose-built POS interface
- **QR code ordering** — generate QR codes for tables and scan codes in-app (`qrcode`, `qrcode.react`, `@yudiel/react-qr-scanner`, jsQR)
- **Inventory management** — keep track of stock alongside your orders and menu
- **PDF receipts** — generate and print customer receipts with jsPDF
- **Sales analytics** — visual dashboards and charts powered by Recharts
- **Real-time backend** — data powered by Supabase for fast, reliable syncing
- **Dark & light themes** — theme switching with next-themes, toast notifications, and a full shadcn/ui + Radix component set

## Tech Stack

- **Framework:** Next.js 15 + React 19
- **Language:** JavaScript
- **Backend:** Supabase
- **Styling & UI:** Tailwind CSS, shadcn/ui, Radix UI, Framer Motion
- **Extras:** QR code generation & scanning, jsPDF, Recharts, Lucide icons

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Create a Supabase project and add its URL and anon key to a `.env.local` file to connect the backend.

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # run ESLint
```

---

⭐ If this POS system helps your restaurant or inspires your own build, consider giving it a star — contributions and feedback are welcome!
