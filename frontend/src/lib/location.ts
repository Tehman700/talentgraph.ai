type CountryOption = { code: string; name: string }

type ParsedLocation = {
  city: string
  countryCode: string
}

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'US',
  'united states': 'US',
  uk: 'GB',
  'united kingdom': 'GB',
  england: 'GB',
  uae: 'AE',
  'united arab emirates': 'AE',
  korea: 'KR',
  'south korea': 'KR',
  russia: 'RU',
  'russia federation': 'RU',
  iran: 'IR',
  vietnam: 'VN',
  phillippines: 'PH',
  philippines: 'PH',
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function toCodeMap(countryList: CountryOption[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const c of countryList) {
    const key = normalize(c.name)
    map.set(key, c.code)
  }
  return map
}

export function parseDetectedLocation(
  detectedLocation: string | undefined,
  countryList: CountryOption[],
): ParsedLocation {
  const fallback: ParsedLocation = { city: '', countryCode: '' }
  if (!detectedLocation) return fallback

  const text = detectedLocation.trim()
  if (!text) return fallback

  const countryByName = toCodeMap(countryList)
  const chunks = text
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

  let city = chunks[0] || ''
  let countryCode = ''

  const candidates: string[] = []
  if (chunks.length > 1) {
    candidates.push(chunks[chunks.length - 1])
  }
  candidates.push(...chunks)

  for (const candidate of candidates) {
    const norm = normalize(candidate)

    if (countryByName.has(norm)) {
      countryCode = countryByName.get(norm) || ''
      break
    }

    const aliasCode = COUNTRY_ALIASES[norm]
    if (aliasCode) {
      countryCode = aliasCode
      break
    }

    const byCode = countryList.find((c) => c.code.toLowerCase() === norm)
    if (byCode) {
      countryCode = byCode.code
      break
    }
  }

  if (!city && chunks.length > 1) {
    city = chunks[0]
  }

  if (countryCode && city && normalize(city) === countryCode.toLowerCase()) {
    city = ''
  }

  return { city, countryCode }
}
