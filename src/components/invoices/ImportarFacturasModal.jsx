import { useState, useRef } from 'react'
import { api } from '@/api'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { fmtDate } from '@/lib/utils'

// Parsea CSV/TSV con soporte a comillas y punto y coma o coma como separador
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const sep = lines[0].includes(';') ? ';' : ','
  const parseRow = (line) => {
    const cols = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === sep && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    return cols
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[\s/]/g, '_'))
  const aliasMap = {
    // cliente
    cliente: 'cliente', client: 'cliente', razon_social: 'cliente', empresa: 'cliente',
    // rut
    rut: 'rut', nit: 'rut',
    // telefono
    telefono: 'telefono', phone: 'telefono', whatsapp: 'telefono', tel: 'telefono',
    // email
    email: 'email', correo: 'email', mail: 'email',
    // cfe
    cfe: 'cfe_id', cfe_id: 'cfe_id', factura: 'cfe_id', n_factura: 'cfe_id', numero: 'cfe_id',
    // monto
    monto: 'monto', importe: 'monto', amount: 'monto', total: 'monto',
    // emision
    emision: 'emision', fecha_emision: 'emision', issued: 'emision', fecha: 'emision',
    // vencimiento
    vencimiento: 'vencimiento', vence: 'vencimiento', due: 'vencimiento', fecha_vencimiento: 'vencimiento',
  }

  const mappedHeaders = headers.map(h => aliasMap[h] ?? h)

  return lines.slice(1)
    .filter(l => l.trim())
    .map(l => {
      const vals = parseRow(l)
      const row = {}
      mappedHeaders.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return {
        clientName: row.cliente ?? '',
        rut:        row.rut ?? '',
        phone:      row.telefono ?? '',
        email:      row.email ?? '',
        cfeId:      row.cfe_id ?? '',
        amount:     row.monto?.replace(/[^\d.,]/g, '').replace(',', '.') ?? '',
        issued:     parseDate(row.emision),
        due:        parseDate(row.vencimiento),
      }
    })
    .filter(r => r.clientName || r.cfeId)
}

function parseDate(str) {
  if (!str) return ''
  // dd/mm/yyyy o dd-mm-yyyy → yyyy-mm-dd
  const m = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
  if (m) {
    const [, d, mo, y] = m
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }
  // yyyy-mm-dd → ok
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return ''
}

function isRowValid(r) {
  return r.clientName && r.amount && parseFloat(r.amount) > 0 && r.due
}

// ─── Template de descarga ───────────────────────────────────────
function downloadTemplate() {
  const csv = [
    'Cliente;RUT;Telefono;Email;CFE;Monto;Emision;Vencimiento',
    'Supermercado El Sol;219876540015;+59899123456;pagos@elsol.uy;A 0001-000001;15000;15/05/2025;15/06/2025',
    'Ferretería Norte;218765430012;+59898765432;;CFE-2025-002;8500;01/05/2025;01/06/2025',
  ].join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'plantilla-facturas.csv' })
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function ImportarFacturasModal({ onClose, onImported }) {
  const [rows, setRows]         = useState(null)   // null = no file yet
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef                 = useRef()

  const processFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCsv(e.target.result)
      setRows(parsed)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handleImport = async () => {
    if (!rows?.length) return
    const valid = rows.filter(isRowValid)
    if (!valid.length) { toast.error('No hay filas válidas para importar'); return }
    setLoading(true)
    try {
      const res = await api.importInvoices(valid)
      setResult(res)
      if (res.created > 0) {
        toast.success(`${res.created} factura${res.created > 1 ? 's' : ''} importada${res.created > 1 ? 's' : ''}`)
        onImported()
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const validCount   = rows?.filter(isRowValid).length ?? 0
  const invalidCount = (rows?.length ?? 0) - validCount

  return (
    <Modal title="Importar facturas desde CSV" onClose={onClose} width={640}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Upload zone */}
        {!rows && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--green-l)' : 'var(--border2)'}`,
                borderRadius: 10, padding: '40px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'all .2s',
                background: dragOver ? 'rgba(45,158,95,0.05)' : 'var(--surface2)',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>
                Arrastrá tu CSV aquí o hacé clic para elegir
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                Formatos soportados: .csv · Separadores: coma o punto y coma
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                onChange={e => processFile(e.target.files[0])} />
            </div>

            {/* Template download */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--white)' }}>¿Primera vez?</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Descargá la plantilla con el formato correcto</div>
              </div>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>↓ Plantilla</Button>
            </div>

            {/* Column guide */}
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
              <strong style={{ color: 'var(--white)' }}>Columnas reconocidas:</strong>{' '}
              Cliente · RUT · Telefono · Email · CFE · Monto · Emision · Vencimiento
              <br />
              <span style={{ fontSize: 10 }}>Fechas: dd/mm/yyyy o yyyy-mm-dd · Monto sin puntos de miles</span>
            </div>
          </>
        )}

        {/* Preview */}
        {rows && !result && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>
                {rows.length} filas detectadas
              </span>
              <span style={{ fontSize: 11, color: '#4caf7d' }}>✓ {validCount} válidas</span>
              {invalidCount > 0 && <span style={{ fontSize: 11, color: 'var(--red)' }}>⚠ {invalidCount} con datos faltantes</span>}
              <button onClick={() => setRows(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>
                ✕ Cambiar archivo
              </button>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Estado', 'Cliente', 'CFE', 'Monto', 'Vencimiento'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', fontFamily: 'var(--font-ui)', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const ok = isRowValid(r)
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: ok ? 'transparent' : 'rgba(224,96,96,0.05)' }}>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontSize: 12 }}>{ok ? '✅' : '⚠️'}</span>
                        </td>
                        <td style={{ padding: '7px 10px', color: 'var(--white)', fontWeight: 600 }}>{r.clientName || <span style={{ color: 'var(--red)', fontStyle: 'italic' }}>falta</span>}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--muted)', fontStyle: 'italic' }}>{r.cfeId || '—'}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                          {r.amount ? `$${parseFloat(r.amount).toLocaleString('es-UY')}` : <span style={{ color: 'var(--red)', fontStyle: 'italic' }}>falta</span>}
                        </td>
                        <td style={{ padding: '7px 10px', color: r.due ? 'var(--white)' : 'var(--red)', fontStyle: r.due ? 'normal' : 'italic' }}>
                          {r.due ? fmtDate(r.due) : 'falta'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Result */}
        {result && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{result.created > 0 ? '🎉' : '⚠️'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--white)', marginBottom: 8 }}>
              {result.created} factura{result.created !== 1 ? 's' : ''} importada{result.created !== 1 ? 's' : ''}
            </div>
            {result.skipped > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{result.skipped} filas con errores</div>
            )}
            {result.errors?.length > 0 && (
              <div style={{ textAlign: 'left', marginTop: 12, padding: 12, background: 'var(--surface2)', borderRadius: 8, maxHeight: 120, overflowY: 'auto' }}>
                {result.errors.map((e, i) => (
                  <div key={i} style={{ fontSize: 10, color: 'var(--red)', marginBottom: 4 }}>• {e}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onClick={onClose}>
          {result ? 'Cerrar' : 'Cancelar'}
        </Button>
        {rows && !result && (
          <Button onClick={handleImport} disabled={loading || validCount === 0}>
            {loading ? 'Importando…' : `Importar ${validCount} factura${validCount !== 1 ? 's' : ''}`}
          </Button>
        )}
      </div>
    </Modal>
  )
}
