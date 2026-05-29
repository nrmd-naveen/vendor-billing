import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { machineIdSync } from 'node-machine-id'

// Generated once by: node scripts/generate-keys.js
// Paste the public key output here
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2QeGHEQXsCGP0Ehxn9pM
y7d1cEXZRA7q0vlVqGHNYZJjHiuHs/8M7rTNn+DUYYEQSn/1TUom2hNQcCA/Zt4o
fTJDQIliJJhbHRQDU0mgmxzylKasBTSIqpuUYld4ALQEgLnOX/b5Evt8FJxYl8V0
M1DQAuL278wNdutw9J6xx43eUeg4cfZQ1A12WDmlKZL1WNPJUmRPLJ0180+dNo0i
bKj6gKYqG9C9QZ2lGIfOQwGqkqzWhp28cYUNTx7gogjFrJcu3aPUz7bEe0DmqQQC
eL2+ALv2Uc11NzS3vRCDKVU6pM0wEynuD/J0WfaL6iyPPJhMlAe9Pd9Tj/dgODwh
4wIDAQAB
-----END PUBLIC KEY-----`

function licenseFilePath(): string {
  return path.join(app.getPath('userData'), 'vb-license.key')
}

export function getMachineId(): string {
  try {
    return machineIdSync(true)
  } catch {
    return 'unknown-machine'
  }
}

export function verifyLicense(licenseKey: string, machineId: string): boolean {
  if (!licenseKey || !machineId) return false
  try {
    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(machineId)
    return verify.verify(PUBLIC_KEY, Buffer.from(licenseKey, 'base64'))
  } catch {
    return false
  }
}

export function loadLicense(): string | null {
  try {
    const p = licenseFilePath()
    if (!fs.existsSync(p)) return null
    return fs.readFileSync(p, 'utf-8').trim()
  } catch {
    return null
  }
}

export function saveLicense(licenseKey: string): void {
  fs.writeFileSync(licenseFilePath(), licenseKey, 'utf-8')
}

export function isLicensed(): boolean {
  const key = loadLicense()
  if (!key) return false
  return verifyLicense(key, getMachineId())
}
