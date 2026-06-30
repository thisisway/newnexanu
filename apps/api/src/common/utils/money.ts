import { BadRequestException } from '@nestjs/common'

/**
 * Normalizes a money string coming from the UI into a dot-decimal string that
 * Prisma's Decimal columns accept.
 *
 * Brazilian users type "29,90" or "1.234,56"; JS/Prisma need "29.90" /
 * "1234.56". When a comma is present it is treated as the decimal separator and
 * dots are treated as thousands separators. When there is no comma the value is
 * assumed to already use a dot decimal (or be an integer) and is left intact.
 */
export function normalizeMoney(value: unknown): string {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (raw === '') return ''
  return raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
}

/**
 * Normalizes and validates a required money value, throwing a friendly error
 * when it is not a valid non-negative number.
 */
export function parseMoney(value: unknown, field = 'valor'): string {
  const normalized = normalizeMoney(value)
  const n = Number(normalized)
  if (normalized === '' || Number.isNaN(n)) {
    throw new BadRequestException(`O ${field} informado é inválido.`)
  }
  if (n < 0) {
    throw new BadRequestException(`O ${field} não pode ser negativo.`)
  }
  return normalized
}
