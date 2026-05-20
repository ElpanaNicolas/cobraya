# Configuración WhatsApp + IA

## Lo que vas a necesitar

| Servicio | Para qué | Costo estimado |
|----------|----------|----------------|
| Twilio   | Enviar/recibir WhatsApp | ~$0.005 USD por mensaje |
| Anthropic | Generar respuestas con Claude | ~$0.001–0.01 USD por respuesta |

---

## Paso 1 — Twilio

1. Crear cuenta en [twilio.com](https://twilio.com) (gratis)
2. Ir a **Messaging → Try it out → Send a WhatsApp message**
3. Seguir las instrucciones del sandbox: mandás un mensaje desde tu celular para activarlo
4. Anotar:
   - **Account SID** (empieza con `AC...`)
   - **Auth Token**
   - **Sandbox number** (ej: `+14155238886`)

---

## Paso 2 — Anthropic API Key

1. Ir a [console.anthropic.com](https://console.anthropic.com)
2. **API Keys → Create Key**
3. Copiar la key (empieza con `sk-ant-...`)

---

## Paso 3 — Instalar Supabase CLI

```bash
# Mac
brew install supabase/tap/supabase

# O con npm
npm install -g supabase
```

---

## Paso 4 — Vincular el proyecto

```bash
cd ~/Desktop/cobraya

# Login
supabase login

# Vincular con tu proyecto (el ref está en Settings → General de tu proyecto Supabase)
supabase link --project-ref TU_PROJECT_REF
```

---

## Paso 5 — Configurar secrets en Supabase

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=tu_auth_token
supabase secrets set TWILIO_WHATSAPP_NUMBER=+14155238886
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

---

## Paso 6 — Deployar las Edge Functions

```bash
supabase functions deploy whatsapp-inbound --no-verify-jwt
supabase functions deploy whatsapp-send
```

El flag `--no-verify-jwt` en `whatsapp-inbound` es necesario porque Twilio
llama al webhook sin token de autenticación.

---

## Paso 7 — Configurar el webhook en Twilio

Una vez deployado, la URL del webhook es:

```
https://TU_PROJECT_REF.supabase.co/functions/v1/whatsapp-inbound
```

En Twilio Dashboard:
1. **Messaging → Settings → WhatsApp sandbox settings**
2. En **"When a message comes in"**: pegar la URL arriba
3. Método: **HTTP POST**
4. Guardar

---

## Paso 8 — Probar

1. Desde tu celular (el que activaste en el sandbox), mandar un WhatsApp al número del sandbox
2. En Supabase → **Edge Functions → Logs** vas a ver los logs en tiempo real
3. En Cobraya → **Agente IA** deberías ver la conversación aparecer

---

## Cómo funciona el flujo completo

```
Cliente manda WA
    ↓
Twilio recibe y llama a whatsapp-inbound (Edge Function)
    ↓
Edge Function:
  - Guarda el mensaje del cliente en la DB
  - Busca el contexto (factura, historial de chat)
  - Llama a Claude con el contexto y la configuración del agente
  - Guarda la respuesta en la DB
  - Envía la respuesta al cliente vía Twilio
    ↓
La respuesta llega al WhatsApp del cliente
    ↓
Cobraya muestra la conversación actualizada en tiempo real
```

Cuando vos apretás "Recordatorio" o "Activar IA" en una factura:
```
Frontend → whatsapp-send (Edge Function)
    ↓
Claude genera el mensaje según el tono configurado
    ↓
Se guarda en DB + se envía por Twilio al cliente
    ↓
El chat se actualiza automáticamente
```

---

## Troubleshooting

**"Function not found"** → Verificar que deployaste con `supabase functions deploy`

**"Twilio error: 21606"** → El número no está en el sandbox. El cliente tiene que mandar primero el mensaje de activación.

**Claude no responde bien** → Ajustar el tono y el prompt en Configuración → Agente IA

**No llegan mensajes** → Verificar la URL del webhook en Twilio y que `--no-verify-jwt` esté en whatsapp-inbound
