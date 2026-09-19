import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPRESS_THRESHOLD_BYTES, MAX_IMAGE_EDGE, compressImage } from './imageCompression'

function fileOf(size: number, type = 'image/jpeg', name = 'IMG_0001.jpeg') {
  return new File([new Uint8Array(size)], name, { type, lastModified: 1_700_000_000_000 })
}

function stubCanvas(blobSizes: number[]) {
  const drawn: Array<[number, number]> = []
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: (_b: unknown, _x: number, _y: number, w: number, h: number) => drawn.push([w, h]),
    }),
    toBlob: vi.fn((cb: (b: Blob | null) => void) => {
      const size = blobSizes.shift() ?? 1
      cb(new Blob([new Uint8Array(size)], { type: 'image/jpeg' }))
    }),
  }
  vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement)
  return { canvas, drawn }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('compressImage', () => {
  it('laisse passer les PDF et les petites images', async () => {
    const pdf = fileOf(COMPRESS_THRESHOLD_BYTES * 3, 'application/pdf', 'a.pdf')
    const small = fileOf(COMPRESS_THRESHOLD_BYTES - 1)
    expect(await compressImage(pdf)).toBe(pdf)
    expect(await compressImage(small)).toBe(small)
  })

  it("renvoie le fichier d'origine si le navigateur ne sait pas décoder l'image", async () => {
    const big = fileOf(12 * 1024 * 1024)
    vi.stubGlobal('createImageBitmap', undefined)
    expect(await compressImage(big)).toBe(big)
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')))
    expect(await compressImage(big)).toBe(big)
  })

  it('redimensionne, ré-encode en JPEG et conserve lastModified', async () => {
    const big = fileOf(12 * 1024 * 1024, 'image/png', 'capture.png')
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 5120, height: 3840, close: vi.fn() }))
    const { drawn } = stubCanvas([900_000])

    const out = await compressImage(big)

    expect(out).not.toBe(big)
    expect(out.type).toBe('image/jpeg')
    expect(out.name).toBe('capture.jpg')
    expect(out.size).toBe(900_000)
    expect(out.lastModified).toBe(big.lastModified)
    expect(drawn[0]).toEqual([MAX_IMAGE_EDGE, 1920])
  })

  it('baisse la qualité tant que le résultat reste trop lourd', async () => {
    const big = fileOf(14 * 1024 * 1024)
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }))
    const { canvas } = stubCanvas([6_000_000, 4_000_000, 2_000_000])

    const out = await compressImage(big)

    expect(canvas.toBlob).toHaveBeenCalledTimes(3)
    expect(out.size).toBe(2_000_000)
  })

  it("garde l'original si la compression n'apporte rien", async () => {
    const big = fileOf(2 * 1024 * 1024)
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1000, height: 800, close: vi.fn() }))
    stubCanvas([3_000_000, 3_000_000, 3_000_000])
    expect(await compressImage(big)).toBe(big)
  })
})
