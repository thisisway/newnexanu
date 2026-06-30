import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { normalizeMoney, parseMoney } from './money'

test('normalizeMoney converts Brazilian comma decimals to dot decimals', () => {
  assert.equal(normalizeMoney('29,90'), '29.90')        // the spec example
  assert.equal(normalizeMoney('1.234,56'), '1234.56')   // thousands + decimal
  assert.equal(normalizeMoney('149,90'), '149.90')
  assert.equal(normalizeMoney('  79,90 '), '79.90')     // trims whitespace
})

test('normalizeMoney leaves dot decimals and integers untouched', () => {
  assert.equal(normalizeMoney('29.90'), '29.90')
  assert.equal(normalizeMoney('2990'), '2990')
  assert.equal(normalizeMoney('0'), '0')
})

test('normalizeMoney handles empty / nullish input', () => {
  assert.equal(normalizeMoney(''), '')
  assert.equal(normalizeMoney(null), '')
  assert.equal(normalizeMoney(undefined), '')
})

test('parseMoney returns a valid numeric string for good input', () => {
  assert.equal(parseMoney('29,90'), '29.90')
  assert.equal(parseMoney('0'), '0')
  assert.equal(Number(parseMoney('1.234,56')), 1234.56)
})

test('parseMoney rejects invalid, empty and negative values', () => {
  assert.throws(() => parseMoney('abc'), /inválido/i)
  assert.throws(() => parseMoney(''), /inválido/i)
  assert.throws(() => parseMoney('-5'), /negativo/i)
  assert.throws(() => parseMoney('-0,01'), /negativo/i)
})
