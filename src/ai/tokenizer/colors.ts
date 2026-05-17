export type TokenColor = { bg: string; bd: string; tx: string }

const PALETTE: TokenColor[] = [
  { bg: '#FBEAF0', bd: '#ED93B1', tx: '#4B1528' },
  { bg: '#E1F5EE', bd: '#5DCAA5', tx: '#085041' },
  { bg: '#EEEDFE', bd: '#AFA9EC', tx: '#3C3489' },
  { bg: '#E6F1FB', bd: '#85B7EB', tx: '#042C53' },
  { bg: '#FAECE7', bd: '#F0997B', tx: '#4A1B0C' },
  { bg: '#FAEEDA', bd: '#EF9F27', tx: '#412402' },
  { bg: '#FFF6CC', bd: '#E5C100', tx: '#3A3000' },
  { bg: '#E5F0FF', bd: '#6FA4E0', tx: '#0B2A4E' },
  { bg: '#E0F0F8', bd: '#5BA8C9', tx: '#0B3A4A' },
  { bg: '#FDE8DC', bd: '#E0825C', tx: '#5C1F08' },
  { bg: '#F0E6FA', bd: '#B58AE0', tx: '#3A1E5A' },
  { bg: '#E6FAEC', bd: '#7CC894', tx: '#0E3D1F' },
]

const NEUTRAL: TokenColor = { bg: '#F2F2F2', bd: '#BBBBBB', tx: '#666666' }

function hashString(input: string): number {
  let hash = 5381
  for (let index = 0; index < input.length; index++) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

export function tokenColor(token: string): TokenColor {
  if (!token || token === '</w>') {
    return NEUTRAL
  }
  return PALETTE[hashString(token) % PALETTE.length]
}
