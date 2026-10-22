import React from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { money } from '../../../shared/cashFormat'
import './DifferencesByDay.css'

interface Props {
  rows: { day: string; short: number; over: number; net: number }[]
}

/** Gráfica de diferencias por día: faltantes hacia abajo (rojo) y sobrantes hacia arriba (azul). */
const DifferencesByDay: React.FC<Props> = ({ rows }) => {
  if (!rows.length) return <p className='differences-by-day__empty'>Sin diferencias en el periodo.</p>
  const data = rows.map((r) => ({ ...r, label: r.day.slice(5).split('-').reverse().join('/') }))
  return (
    <div className='differences-by-day'>
      <ResponsiveContainer width='100%' height={220}>
        <BarChart data={data} stackOffset='sign' margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--panel-border)' />
          <XAxis dataKey='label' tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => `$${Number(v).toLocaleString('es-MX', { notation: 'compact' })}`} />
          <ReferenceLine y={0} stroke='var(--panel-border)' />
          <Tooltip formatter={(v: any, name: any) => [money(Number(v)), name === 'short' ? 'Faltante' : 'Sobrante']} cursor={{ fill: 'color-mix(in srgb, var(--primary-color, #072a57) 6%, transparent)' }} />
          <Bar dataKey='short' stackId='d' fill='#d64545' radius={[0, 0, 6, 6]} maxBarSize={36} />
          <Bar dataKey='over' stackId='d' fill='#2563eb' radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DifferencesByDay
