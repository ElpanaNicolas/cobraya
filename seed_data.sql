-- ══════════════════════════════════════════════════════════════
-- COBRAYA — Datos de prueba
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- Detecta tu profile_id automáticamente (el único usuario registrado)
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  pid   uuid;

  -- Clientes
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid;

  -- Facturas
  i1  uuid; i2  uuid; i3  uuid; i4  uuid; i5  uuid;
  i6  uuid; i7  uuid; i8  uuid; i9  uuid; i10 uuid;
  i11 uuid; i12 uuid;

  -- Conversaciones
  conv1 uuid; conv2 uuid; conv3 uuid;

BEGIN
  -- ── Tomar el primer profile ────────────────────────────────
  SELECT id INTO pid FROM profiles LIMIT 1;

  IF pid IS NULL THEN
    RAISE EXCEPTION 'No hay ningún usuario registrado todavía. Creá tu cuenta primero.';
  END IF;

  -- ── Clientes ───────────────────────────────────────────────
  INSERT INTO clients (profile_id, name, rut, phone, email)
    VALUES (pid, 'Ferrería del Sur S.A.', '21.345.678-9', '+598 98 765 432', 'pagos@ferreteriasur.com.uy')
    RETURNING id INTO c1;

  INSERT INTO clients (profile_id, name, rut, phone, email)
    VALUES (pid, 'Restaurant El Gaucho', '21.678.901-2', '+598 99 234 567', 'admin@elgaucho.uy')
    RETURNING id INTO c2;

  INSERT INTO clients (profile_id, name, rut, phone, email)
    VALUES (pid, 'Supermercado Rambla S.A.', '21.112.233-4', '+598 96 111 222', 'compras@rambla.com.uy')
    RETURNING id INTO c3;

  INSERT INTO clients (profile_id, name, rut, phone, email)
    VALUES (pid, 'Estudio Contable Méndez', '21.556.789-3', '+598 92 445 678', 'mendez@estudio.uy')
    RETURNING id INTO c4;

  INSERT INTO clients (profile_id, name, rut, phone, email)
    VALUES (pid, 'Distribuidora Norte S.R.L.', '21.889.012-7', '+598 94 889 001', 'gerencia@dinorte.com.uy')
    RETURNING id INTO c5;

  INSERT INTO clients (profile_id, name, rut, phone, email)
    VALUES (pid, 'Clínica Veterinaria Prado', '21.223.445-1', '+598 98 223 445', 'clinica@vetprado.uy')
    RETURNING id INTO c6;

  -- ── Facturas pagadas (historial de 3 meses) ────────────────
  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c3, 'CFE-2026-001', 48500, now() - interval '82 days', now() - interval '52 days', 'paid', 'whatsapp', null)
    RETURNING id INTO i1;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c4, 'CFE-2026-002', 22000, now() - interval '75 days', now() - interval '45 days', 'paid', 'whatsapp', null)
    RETURNING id INTO i2;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c1, 'CFE-2026-003', 67800, now() - interval '68 days', now() - interval '38 days', 'paid', 'whatsapp', null)
    RETURNING id INTO i3;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c6, 'CFE-2026-004', 15000, now() - interval '60 days', now() - interval '30 days', 'paid', 'email', null)
    RETURNING id INTO i4;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c3, 'CFE-2026-005', 53200, now() - interval '50 days', now() - interval '20 days', 'paid', 'whatsapp', null)
    RETURNING id INTO i5;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c4, 'CFE-2026-006', 31500, now() - interval '42 days', now() - interval '12 days', 'paid', 'whatsapp', null)
    RETURNING id INTO i6;

  -- ── Facturas activas (estados variados) ───────────────────
  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c2, 'CFE-2026-007', 89400, now() - interval '45 days', now() - interval '15 days', 'overdue', 'whatsapp',
      'Cliente no responde hace 8 días. Intenté contacto 3 veces. Recomiendo escalar.')
    RETURNING id INTO i7;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c5, 'CFE-2026-008', 112000, now() - interval '38 days', now() - interval '8 days', 'overdue', 'whatsapp',
      'Respondió que tiene problemas de caja. Propuse plan de 3 cuotas, está evaluando.')
    RETURNING id INTO i8;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c1, 'CFE-2026-009', 44600, now() - interval '25 days', now() + interval '5 days', 'reminded', 'whatsapp',
      'Recordatorio enviado. Prometió pagar esta semana.')
    RETURNING id INTO i9;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c5, 'CFE-2026-010', 78300, now() - interval '20 days', now() + interval '10 days', 'ai_negotiating', 'whatsapp',
      'Negociando plan de cuotas: 3 pagos de $26.100. Cliente aceptó la propuesta en principio.')
    RETURNING id INTO i10;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c6, 'CFE-2026-011', 19800, now() - interval '10 days', now() + interval '20 days', 'pending', 'email', null)
    RETURNING id INTO i11;

  INSERT INTO invoices (profile_id, client_id, cfe_id, amount, issued, due, status, channel, ai_note)
    VALUES (pid, c2, 'CFE-2026-012', 56000, now() - interval '5 days', now() + interval '25 days', 'pending', 'whatsapp', null)
    RETURNING id INTO i12;

  -- ── Conversaciones + mensajes ─────────────────────────────

  -- Conv 1: Restaurant El Gaucho — factura vencida, sin respuesta reciente
  INSERT INTO conversations (profile_id, client_id, invoice_id)
    VALUES (pid, c2, i7) RETURNING id INTO conv1;

  INSERT INTO messages (conversation_id, from_role, body, status, sent_at) VALUES
    (conv1, 'agent',  'Hola! Le escribo de parte de CobraYa. La factura CFE-2026-007 por $89.400 venció el ' || to_char(now() - interval '15 days', 'DD/MM/YYYY') || '. ¿Podría indicarnos cuándo podemos esperar el pago? Gracias.',
     'read', now() - interval '15 days' + interval '10 hours'),
    (conv1, 'client', 'Hola, disculpe la demora. Esta semana lo resolvemos.',
     'read', now() - interval '14 days' + interval '14 hours'),
    (conv1, 'agent',  'Perfecto, muchas gracias por responder. Quedamos atentos para el viernes. Si necesita coordinar algo, no dude en escribirnos.',
     'read', now() - interval '14 days' + interval '14 hours' + interval '5 minutes'),
    (conv1, 'agent',  'Buen día. Han pasado 5 días hábiles y aún no hemos recibido el pago de $89.400. ¿Puede darnos una fecha concreta?',
     'read', now() - interval '9 days' + interval '9 hours'),
    (conv1, 'agent',  'Le recordamos que la deuda de $89.400 sigue pendiente. En caso de no recibir respuesta en 48hs, el caso será escalado al titular de la cuenta.',
     'delivered', now() - interval '4 days' + interval '10 hours');

  -- Conv 2: Distribuidora Norte — negociando plan de cuotas
  INSERT INTO conversations (profile_id, client_id, invoice_id)
    VALUES (pid, c5, i10) RETURNING id INTO conv2;

  INSERT INTO messages (conversation_id, from_role, body, status, sent_at) VALUES
    (conv2, 'agent',  'Hola, buenos días. Le contactamos por la factura CFE-2026-010 por $78.300, con vencimiento en 10 días. ¿Todo bien para el pago?',
     'read', now() - interval '12 days' + interval '9 hours'),
    (conv2, 'client', 'Hola, la verdad estamos con la caja un poco ajustada este mes. ¿Pueden darme alguna facilidad?',
     'read', now() - interval '11 days' + interval '11 hours'),
    (conv2, 'agent',  'Entendemos la situación. Podemos ofrecerle un plan de 3 cuotas de $26.100 cada una, sin interés. La primera al vencimiento y las siguientes con 30 días de diferencia. ¿Le parece viable?',
     'read', now() - interval '11 days' + interval '11 hours' + interval '3 minutes'),
    (conv2, 'client', 'Sí, eso me sirve mucho. ¿Cómo procedemos?',
     'read', now() - interval '10 days' + interval '16 hours'),
    (conv2, 'agent',  'Perfecto. Le confirmo el plan: Cuota 1: $26.100 el ' || to_char(now() + interval '10 days', 'DD/MM') || ', Cuota 2: $26.100 el ' || to_char(now() + interval '40 days', 'DD/MM') || ', Cuota 3: $26.100 el ' || to_char(now() + interval '70 days', 'DD/MM') || '. Le llegará un resumen por este medio. ¡Gracias por la buena disposición!',
     'read', now() - interval '10 days' + interval '16 hours' + interval '2 minutes'),
    (conv2, 'client', 'Perfecto, muchas gracias.',
     'read', now() - interval '10 days' + interval '16 hours' + interval '10 minutes');

  -- Conv 3: Ferrería del Sur — recordatorio enviado
  INSERT INTO conversations (profile_id, client_id, invoice_id)
    VALUES (pid, c1, i9) RETURNING id INTO conv3;

  INSERT INTO messages (conversation_id, from_role, body, status, sent_at) VALUES
    (conv3, 'agent',  'Buen día. Le avisamos que la factura CFE-2026-009 por $44.600 vence en 5 días (el ' || to_char(now() + interval '5 days', 'DD/MM/YYYY') || '). ¿Quiere que le enviemos los datos de pago?',
     'read', now() - interval '3 days' + interval '9 hours'),
    (conv3, 'client', 'Sí por favor, mándeme los datos.',
     'read', now() - interval '3 days' + interval '10 hours'),
    (conv3, 'agent',  'Claro. Puede transferir a: Banco República, Cuenta Corriente 234-567890/89, titular CobraYa S.A., RUT 21.999.888-7. Referencia: CFE-2026-009. Ante cualquier consulta, estamos a las órdenes.',
     'read', now() - interval '3 days' + interval '10 hours' + interval '1 minute'),
    (conv3, 'client', 'Gracias, lo hacemos esta semana.',
     'delivered', now() - interval '2 days' + interval '15 hours');

  RAISE NOTICE 'Datos de prueba insertados correctamente para profile_id: %', pid;
END;
$$;
