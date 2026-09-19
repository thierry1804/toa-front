import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { parseKmzFile } from './kmzParser'

function kml(placemarks: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    ${placemarks}
  </Document>
</kml>`
}

function placemark(opts: {
  name: string
  lng: number
  lat: number
  alt?: number
  fokontany?: string
  commune?: string
  district?: string
  extra?: string
}): string {
  const coords = `${opts.lng},${opts.lat}${opts.alt != null ? `,${opts.alt}` : ''}`
  const extData =
    opts.fokontany != null || opts.commune != null || opts.district != null || opts.extra != null
      ? `<ExtendedData>
          ${opts.fokontany != null ? `<Data name="Fokontany"><value>${opts.fokontany}</value></Data>` : ''}
          ${opts.commune != null ? `<Data name="Commune"><value>${opts.commune}</value></Data>` : ''}
          ${opts.district != null ? `<Data name="District"><value>${opts.district}</value></Data>` : ''}
          ${opts.extra ?? ''}
        </ExtendedData>`
      : ''
  return `<Placemark>
    <name>${opts.name}</name>
    <Point><coordinates>${coords}</coordinates></Point>
    ${extData}
  </Placemark>`
}

async function makeKmz(kmlContent: string): Promise<File> {
  const zip = new JSZip()
  zip.file('doc.kml', kmlContent)
  const blob = await zip.generateAsync({ type: 'blob' })
  return new File([blob], 'test.kmz', { type: 'application/vnd.google-earth.kmz' })
}

describe('parseKmzFile', () => {
  it('extracts all three ExtendedData fields', async () => {
    const file = await makeKmz(kml(placemark({
      name: 'Tanambe Centre',
      lng: 48.1234,
      lat: -17.5678,
      fokontany: 'Tanambe Centre',
      commune: 'Tanambe',
      district: 'Alaotra Mangoro',
    })))

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites).toHaveLength(1)
    expect(sites[0].nom).toBe('Tanambe Centre')
    expect(sites[0].fokontany).toBe('Tanambe Centre')
    expect(sites[0].commune).toBe('Tanambe')
    expect(sites[0].district).toBe('Alaotra Mangoro')

    expect(metadata['Tanambe Centre']).toEqual({
      fokontany: 'Tanambe Centre',
      commune: 'Tanambe',
      district: 'Alaotra Mangoro',
    })
  })

  it('extracts only Fokontany when Commune and District absent', async () => {
    const file = await makeKmz(kml(placemark({
      name: 'Site A',
      lng: 48.0,
      lat: -18.0,
      fokontany: 'FKT Atsimondrano',
    })))

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites[0].fokontany).toBe('FKT Atsimondrano')
    expect(sites[0].commune).toBeNull()
    expect(sites[0].district).toBeNull()
    expect(metadata['Site A']).toEqual({ fokontany: 'FKT Atsimondrano' })
  })

  it('extracts only Commune and District when Fokontany absent', async () => {
    const file = await makeKmz(kml(placemark({
      name: 'Site B',
      lng: 47.5,
      lat: -19.0,
      commune: 'Antananarivo Renivohitra',
      district: 'Antananarivo Atsimondrano',
    })))

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites[0].fokontany).toBeNull()
    expect(sites[0].commune).toBe('Antananarivo Renivohitra')
    expect(sites[0].district).toBe('Antananarivo Atsimondrano')
    expect(metadata['Site B']).toEqual({
      commune: 'Antananarivo Renivohitra',
      district: 'Antananarivo Atsimondrano',
    })
  })

  it('returns empty metadata when no ExtendedData present', async () => {
    const file = await makeKmz(kml(
      `<Placemark>
        <name>Site Sans Data</name>
        <Point><coordinates>47.5361,-18.9137</coordinates></Point>
      </Placemark>`
    ))

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites).toHaveLength(1)
    expect(sites[0].fokontany).toBeNull()
    expect(sites[0].commune).toBeNull()
    expect(sites[0].district).toBeNull()
    expect(metadata).toEqual({})
  })

  it('handles multiple placemarks with mixed ExtendedData', async () => {
    const file = await makeKmz(kml([
      placemark({ name: 'Site 1', lng: 48.0, lat: -17.0, fokontany: 'FKT1', commune: 'COM1', district: 'DIS1' }),
      placemark({ name: 'Site 2', lng: 48.1, lat: -17.1, fokontany: 'FKT2' }),
      placemark({ name: 'Site 3', lng: 48.2, lat: -17.2 }),
    ].join('\n')))

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites).toHaveLength(3)
    expect(metadata['Site 1']).toEqual({ fokontany: 'FKT1', commune: 'COM1', district: 'DIS1' })
    expect(metadata['Site 2']).toEqual({ fokontany: 'FKT2' })
    expect(metadata['Site 3']).toBeUndefined()
  })

  it('ignores unknown ExtendedData keys', async () => {
    const file = await makeKmz(kml(placemark({
      name: 'Site X',
      lng: 47.0,
      lat: -18.0,
      fokontany: 'FKT X',
      extra: '<Data name="UnknownKey"><value>ignored</value></Data>',
    })))

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites[0].fokontany).toBe('FKT X')
    expect(metadata['Site X']).not.toHaveProperty('UnknownKey')
  })

  it('skips placemarks without coordinates', async () => {
    const file = await makeKmz(kml(
      `<Placemark>
        <name>No Coords</name>
        <ExtendedData><Data name="Fokontany"><value>FKT</value></Data></ExtendedData>
      </Placemark>
      ${placemark({ name: 'Valid', lng: 47.0, lat: -18.0 })}`
    ))

    const { sites } = await parseKmzFile(file)

    expect(sites).toHaveLength(1)
    expect(sites[0].nom).toBe('Valid')
  })

  it('returns empty arrays when KMZ has no KML file', async () => {
    const zip = new JSZip()
    zip.file('readme.txt', 'not a kml')
    const blob = await zip.generateAsync({ type: 'blob' })
    const file = new File([blob], 'empty.kmz')

    const { sites, metadata } = await parseKmzFile(file)

    expect(sites).toEqual([])
    expect(metadata).toEqual({})
  })

  it('assigns unique ids to each site', async () => {
    const file = await makeKmz(kml([
      placemark({ name: 'S1', lng: 47.0, lat: -18.0 }),
      placemark({ name: 'S2', lng: 47.1, lat: -18.1 }),
    ].join('\n')))

    const { sites } = await parseKmzFile(file)

    expect(sites[0].id).not.toBe(sites[1].id)
  })
})

describe('parseKmzFile APN/API flags', () => {
  it('reads APN and API columns as booleans (0/1)', async () => {
    const file = await makeKmz(
      kml(
        placemark({
          name: 'ANK-001',
          lng: 47.5,
          lat: -18.9,
          extra: '<Data name="APN"><value>1</value></Data><Data name="API"><value>0</value></Data>',
        }) +
          placemark({
            name: 'AMP-002',
            lng: 47.6,
            lat: -19,
            extra: '<Data name="apn"><value>0</value></Data><Data name="api"><value>1</value></Data>',
          }),
      ),
    )
    const { sites } = await parseKmzFile(file)
    expect(sites.find((s) => s.nom === 'ANK-001')).toMatchObject({ apn: true, api: false })
    expect(sites.find((s) => s.nom === 'AMP-002')).toMatchObject({ apn: false, api: true })
  })

  it('leaves APN/API unknown (not false) when the columns are absent', async () => {
    const file = await makeKmz(kml(placemark({ name: 'ISO-003', lng: 47.7, lat: -19.1 })))
    const { sites, metadata } = await parseKmzFile(file)
    expect(sites[0].apn).toBeUndefined()
    expect(sites[0].api).toBeUndefined()
    expect(metadata['ISO-003']).toBeUndefined()
  })

  it('leaves APN/API unknown when the cells are blank', async () => {
    const file = await makeKmz(
      kml(
        placemark({
          name: 'ISO-004',
          lng: 47.8,
          lat: -19.2,
          extra: '<Data name="APN"><value></value></Data><Data name="API"><value>  </value></Data>',
        }),
      ),
    )
    const { sites } = await parseKmzFile(file)
    expect(sites[0].apn).toBeUndefined()
    expect(sites[0].api).toBeUndefined()
  })

  it('keeps an explicit 0 as false and records it in the metadata', async () => {
    const file = await makeKmz(
      kml(
        placemark({
          name: 'ISO-005',
          lng: 47.9,
          lat: -19.3,
          extra: '<Data name="APN"><value>0</value></Data>',
        }),
      ),
    )
    const { sites, metadata } = await parseKmzFile(file)
    expect(sites[0].apn).toBe(false)
    expect(sites[0].api).toBeUndefined()
    expect(metadata['ISO-005']).toEqual({ apn: false })
  })

  it('treats only 1/true/oui/yes as true', async () => {
    const file = await makeKmz(
      kml(
        placemark({ name: 'A', lng: 47, lat: -19, extra: '<Data name="APN"><value>Oui</value></Data>' }) +
          placemark({ name: 'B', lng: 47, lat: -19, extra: '<Data name="APN"><value>2</value></Data>' }),
      ),
    )
    const { sites } = await parseKmzFile(file)
    expect(sites.find((s) => s.nom === 'A')?.apn).toBe(true)
    expect(sites.find((s) => s.nom === 'B')?.apn).toBe(false)
  })
})
