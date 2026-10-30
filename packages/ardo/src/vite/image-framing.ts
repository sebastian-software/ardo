import type { ImageCore, ImageFrame } from "../publication/types"

export type CropRectangle = { left: number; top: number; width: number; height: number }
type CropInput = {
  width: number
  height: number
  ratio: readonly [number, number]
  core?: ImageCore
  frame?: ImageFrame
  margin?: number
}
type FramingAreas = { core?: CropRectangle; preferred?: CropRectangle }

/** Keep A and source bounds hard; B and breathing room remain preferences. */
export function calculateImageCrop(input: CropInput): CropRectangle {
  const {
    width,
    height,
    core,
    frame,
    ratio: [rw, rh],
  } = input
  const areas = {
    core: core == null ? undefined : coreRectangle(core, width, height),
    preferred: frame == null ? undefined : frameRectangle(frame, width, height),
  }
  const scale = cropScale(input, areas)
  const size = { width: scale * rw, height: scale * rh }
  const desired = areas.preferred ?? areas.core
  const center = {
    x: desired == null ? width / 2 : desired.left + desired.width / 2,
    y: desired == null ? height / 2 : desired.top + desired.height / 2,
  }
  return {
    ...size,
    left: positionAxis(center.x, size.width, {
      source: width,
      start: areas.core?.left,
      length: areas.core?.width,
    }),
    top: positionAxis(center.y, size.height, {
      source: height,
      start: areas.core?.top,
      length: areas.core?.height,
    }),
  }
}

function cropScale(input: CropInput, areas: FramingAreas): number {
  const {
    width,
    height,
    ratio: [rw, rh],
  } = input
  const margin = input.margin ?? 0.15
  if (!Number.isFinite(margin) || margin < 0 || margin >= 0.5)
    throw new Error("Image margin must be between 0 (inclusive) and 0.5 (exclusive).")
  const min =
    areas.core == null ? 1 : Math.ceil(Math.max(areas.core.width / rw, areas.core.height / rh))
  const max = Math.floor(Math.min(width / rw, height / rh))
  if (min > max)
    throw new Error(
      `Cannot preserve the complete core area in a ${rw}:${rh} crop of ${width}×${height}.`
    )
  const desired = areas.preferred ?? areas.core
  const padding = areas.preferred == null ? 1 - 2 * margin : 1
  return desired == null
    ? max
    : clamp(
        Math.ceil(Math.max(desired.width / padding / rw, desired.height / padding / rh)),
        min,
        max
      )
}

function positionAxis(
  center: number,
  size: number,
  bounds: { source: number; start?: number; length?: number }
): number {
  const min = bounds.start == null ? 0 : Math.max(0, bounds.start + (bounds.length ?? 0) - size)
  const max =
    bounds.start == null ? bounds.source - size : Math.min(bounds.start, bounds.source - size)
  return clamp(Math.round(center - size / 2), min, max)
}

function coreRectangle(core: ImageCore, width: number, height: number): CropRectangle {
  const size = core.size * Math.min(width, height)
  if (![core.x, core.y, core.size].every((value) => Number.isFinite(value)) || size <= 0)
    throw new Error("Image core needs finite x, y, and positive size.")
  const left = Math.floor(core.x * width - size / 2)
  const top = Math.floor(core.y * height - size / 2)
  const right = Math.ceil(core.x * width + size / 2)
  const bottom = Math.ceil(core.y * height + size / 2)
  if (left < 0 || top < 0 || right > width || bottom > height)
    throw new Error("Image core must lie entirely inside the source image.")
  return { left, top, width: right - left, height: bottom - top }
}

function frameRectangle(frame: ImageFrame, width: number, height: number): CropRectangle {
  if (
    ![frame.x, frame.y, frame.width, frame.height].every((value) => Number.isFinite(value)) ||
    frame.x < 0 ||
    frame.y < 0 ||
    frame.width <= 0 ||
    frame.height <= 0 ||
    frame.x + frame.width > 1 ||
    frame.y + frame.height > 1
  )
    throw new Error("Image frame must be a positive normalized rectangle inside the source image.")
  return {
    left: Math.floor(frame.x * width),
    top: Math.floor(frame.y * height),
    width: Math.ceil(frame.width * width),
    height: Math.ceil(frame.height * height),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
