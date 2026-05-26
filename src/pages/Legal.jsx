// Páginas legales: Política de Privacidad y Términos de Servicio
// Rutas: /privacidad  y  /terminos

const C = {
  bg:     '#f5f2ee',
  text:   '#1c1917',
  muted:  'rgba(28,25,23,0.55)',
  green:  '#15803d',
  border: 'rgba(0,0,0,0.08)',
}

function LegalShell({ title, lastUpdated, children }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', sans-serif", color: C.text }}>
      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: '#fff', padding: '0 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: C.text }}>
            cobra<span style={{ color: C.green }}>ya</span>
          </a>
          <a href="/" style={{ fontSize: 13, color: C.muted, textDecoration: 'none' }}>← Volver al inicio</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Última actualización: {lastUpdated}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 32, lineHeight: 1.2 }}>
          {title}
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: C.text }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function H2({ children }) {
  return <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 36, marginBottom: 10, color: C.text }}>{children}</h2>
}
function P({ children }) {
  return <p style={{ marginBottom: 14, color: 'rgba(28,25,23,0.80)' }}>{children}</p>
}
function Li({ children }) {
  return <li style={{ marginBottom: 6, color: 'rgba(28,25,23,0.80)' }}>{children}</li>
}

// ══════════════════════════════════════════════════════════════════════════════
// POLÍTICA DE PRIVACIDAD
// ══════════════════════════════════════════════════════════════════════════════
export function Privacidad() {
  return (
    <LegalShell title="Política de Privacidad" lastUpdated="26 de mayo de 2026">
      <P>
        Cobraya ("nosotros", "nuestro") opera el servicio disponible en <strong>cobraya-phi.vercel.app</strong>.
        Esta política describe cómo recopilamos, usamos y protegemos tu información.
      </P>

      <H2>1. Información que recopilamos</H2>
      <P>Recopilamos la siguiente información cuando usás Cobraya:</P>
      <ul>
        <Li><strong>Datos de cuenta:</strong> nombre, email y contraseña (cifrada) del negocio registrado.</Li>
        <Li><strong>Datos de clientes:</strong> nombres, teléfonos y emails de los deudores que cargás en la plataforma.</Li>
        <Li><strong>Datos de facturas:</strong> montos, fechas de vencimiento y referencias de cobro.</Li>
        <Li><strong>Datos de pago:</strong> credenciales de MercadoPago (access token) almacenadas de forma segura.</Li>
        <Li><strong>Mensajes de WhatsApp:</strong> conversaciones entre el agente IA y los deudores, almacenadas para historial.</Li>
        <Li><strong>Comprobantes de pago:</strong> imágenes subidas por los deudores, procesadas por IA y almacenadas en forma segura.</Li>
      </ul>

      <H2>2. Cómo usamos tu información</H2>
      <ul>
        <Li>Enviar recordatorios de cobro automáticos por WhatsApp y email.</Li>
        <Li>Procesar pagos a través de MercadoPago.</Li>
        <Li>Generar mensajes personalizados mediante inteligencia artificial (Anthropic Claude).</Li>
        <Li>Mostrarte el historial de conversaciones y estado de cobros en el dashboard.</Li>
        <Li>Enviarte emails transaccionales relacionados con tu cuenta.</Li>
      </ul>

      <H2>3. Compartir información con terceros</H2>
      <P>Cobraya utiliza los siguientes servicios de terceros:</P>
      <ul>
        <Li><strong>Supabase</strong> — base de datos y autenticación.</Li>
        <Li><strong>Meta (WhatsApp Cloud API)</strong> — envío y recepción de mensajes de WhatsApp.</Li>
        <Li><strong>MercadoPago</strong> — procesamiento de pagos.</Li>
        <Li><strong>Anthropic (Claude)</strong> — generación de mensajes con IA.</Li>
        <Li><strong>Resend</strong> — envío de emails transaccionales.</Li>
        <Li><strong>Vercel</strong> — hosting de la aplicación.</Li>
      </ul>
      <P>No vendemos ni compartimos tus datos con terceros con fines comerciales.</P>

      <H2>4. Seguridad</H2>
      <P>
        Utilizamos conexiones cifradas (HTTPS), almacenamiento seguro de credenciales y control de acceso
        por roles para proteger tu información. Los access tokens de MercadoPago se almacenan cifrados
        y nunca se exponen al frontend.
      </P>

      <H2>5. Retención de datos</H2>
      <P>
        Conservamos tus datos mientras tu cuenta esté activa. Podés solicitar la eliminación de tu cuenta
        y todos tus datos en cualquier momento escribiendo a <strong>nico@cobraya.app</strong>.
      </P>

      <H2>6. Derechos del usuario</H2>
      <P>Tenés derecho a acceder, corregir o eliminar tus datos personales. Para ejercer estos derechos,
      contactanos en <strong>nico@cobraya.app</strong>.</P>

      <H2>7. Cookies</H2>
      <P>Utilizamos cookies estrictamente necesarias para el funcionamiento de la sesión. No usamos
      cookies de rastreo ni publicidad.</P>

      <H2>8. Contacto</H2>
      <P>Para consultas sobre esta política, escribinos a <strong>nico@cobraya.app</strong>.</P>
    </LegalShell>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TÉRMINOS DE SERVICIO
// ══════════════════════════════════════════════════════════════════════════════
export function Terminos() {
  return (
    <LegalShell title="Términos de Servicio" lastUpdated="26 de mayo de 2026">
      <P>
        Al usar Cobraya aceptás estos términos. Si no estás de acuerdo, no uses el servicio.
      </P>

      <H2>1. El servicio</H2>
      <P>
        Cobraya es una plataforma SaaS de gestión de cobros para PYMEs que automatiza el envío de
        recordatorios de pago vía WhatsApp y email mediante inteligencia artificial.
      </P>

      <H2>2. Registro y cuenta</H2>
      <ul>
        <Li>Debés tener al menos 18 años y representar a un negocio legalmente constituido.</Li>
        <Li>Sos responsable de mantener seguras tus credenciales de acceso.</Li>
        <Li>Una cuenta por negocio (podés invitar colaboradores).</Li>
      </ul>

      <H2>3. Uso aceptable</H2>
      <P>Cobraya solo puede usarse para gestionar cobros legítimos. Está prohibido:</P>
      <ul>
        <Li>Enviar mensajes de acoso, amenazas o contenido ilegal.</Li>
        <Li>Usar el servicio para spam o fines distintos al cobro de deudas reales.</Li>
        <Li>Cargar datos de personas sin su consentimiento previo para contactarlas.</Li>
        <Li>Eludir los límites del plan contratado.</Li>
      </ul>

      <H2>4. Planes y pagos</H2>
      <ul>
        <Li><strong>Plan Free:</strong> hasta 10 clientes y 50 facturas, sin costo.</Li>
        <Li><strong>Plan Pro:</strong> ilimitado, $1.490 UYU/mes facturado por MercadoPago.</Li>
        <Li>Los pagos son recurrentes y se renuevan automáticamente. Podés cancelar cuando quieras.</Li>
        <Li>No hay reembolsos por períodos ya facturados.</Li>
      </ul>

      <H2>5. Disponibilidad</H2>
      <P>
        Nos esforzamos por mantener el servicio disponible 24/7, pero no garantizamos uptime del 100%.
        Podemos interrumpir el servicio temporalmente por mantenimiento con previo aviso.
      </P>

      <H2>6. Limitación de responsabilidad</H2>
      <P>
        Cobraya es una herramienta de gestión. No somos responsables de las decisiones comerciales
        que tomes en base a la información del sistema, ni de mensajes enviados a través de la plataforma
        por mal uso del usuario.
      </P>

      <H2>7. Propiedad intelectual</H2>
      <P>
        El software, diseño y marca de Cobraya son propiedad de sus creadores. Los datos que cargás
        en la plataforma son tuyos.
      </P>

      <H2>8. Terminación</H2>
      <P>
        Podemos suspender cuentas que violen estos términos. Vos podés cancelar tu cuenta en cualquier
        momento desde la configuración o escribiendo a <strong>nico@cobraya.app</strong>.
      </P>

      <H2>9. Cambios</H2>
      <P>
        Podemos actualizar estos términos. Te avisaremos por email con al menos 7 días de anticipación
        ante cambios importantes.
      </P>

      <H2>10. Ley aplicable</H2>
      <P>Estos términos se rigen por las leyes de la República Oriental del Uruguay.</P>

      <H2>11. Contacto</H2>
      <P>Consultas: <strong>nico@cobraya.app</strong></P>
    </LegalShell>
  )
}
