# Cobraya

App de gestión de cobros con agente IA que automatiza el contacto con clientes por WhatsApp.

**Demo:** https://cobraya-phi.vercel.app

## Stack

- React 18 + Vite
- Supabase (auth + base de datos + RLS)
- recharts, lucide-react, date-fns

## Funcionalidades

- Dashboard con KPIs, gráfico de tendencia y feed de actividad del agente
- Gestión de facturas con estados: pendiente, recordatorio, IA negociando, vencida, pagada
- Historial de conversaciones WhatsApp por cliente y factura
- Score de riesgo por cliente basado en historial de pagos
- Agente IA configurable: tono, timing, plan de cuotas automático
- Autenticación con email y contraseña

## Desarrollo local

```bash
# 1. Clonar
git clone https://github.com/ElpanaNicolas/cobraya
cd cobraya

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu URL y anon key de Supabase

# 4. Ejecutar el schema en Supabase SQL Editor
# → supabase_schema.sql

# 5. Arrancar
npm run dev
```

## Variables de entorno

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```
