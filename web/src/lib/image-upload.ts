import sharp from "sharp";

export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export const maxImageSize = 5 * 1024 * 1024;
export const maxUploadFiles = 5;
export const maxInputPixels = 24_000_000;
export const maxOutputDimension = 2_560;

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadError";
  }
}

type ImageFile = Pick<File, "name" | "type" | "size" | "arrayBuffer">;

function detectImageFormat(input: Buffer) {
  if (input.length >= 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
    return "jpeg" as const;
  }
  if (
    input.length >= 8 &&
    input.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png" as const;
  }
  if (
    input.length >= 12 &&
    input.subarray(0, 4).toString("ascii") === "RIFF" &&
    input.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp" as const;
  }
  return null;
}

export async function normalizeUploadedImage(file: ImageFile) {
  if (!allowedImageTypes.includes(file.type as (typeof allowedImageTypes)[number])) {
    throw new ImageUploadError("Use apenas imagens JPG, PNG ou WebP.");
  }
  if (file.size <= 0 || file.size > maxImageSize) {
    throw new ImageUploadError("Cada imagem deve ter no máximo 5 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detectedFormat = detectImageFormat(input);
  const expectedFormatByMime: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const expectedFormat = expectedFormatByMime[file.type];

  if (!detectedFormat || detectedFormat !== expectedFormat) {
    throw new ImageUploadError("O conteúdo do arquivo não corresponde ao formato informado.");
  }

  try {
    const probe = sharp(input, {
      animated: false,
      failOn: "warning",
      limitInputPixels: maxInputPixels,
    });
    const metadata = await probe.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (!width || !height || width * height > maxInputPixels) {
      throw new ImageUploadError("A imagem excede o limite de 24 megapixels.");
    }
    if ((metadata.pages || 1) > 1) {
      throw new ImageUploadError("Imagens animadas não são aceitas.");
    }
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
      throw new ImageUploadError("O conteúdo do arquivo não é uma imagem JPG, PNG ou WebP válida.");
    }

    const data = await sharp(input, {
      animated: false,
      failOn: "warning",
      limitInputPixels: maxInputPixels,
    })
      .rotate()
      .resize({
        width: maxOutputDimension,
        height: maxOutputDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer();

    return {
      data,
      contentType: "image/webp" as const,
      extension: "webp" as const,
      originalWidth: width,
      originalHeight: height,
    };
  } catch (error) {
    if (error instanceof ImageUploadError) throw error;
    throw new ImageUploadError("O arquivo enviado não pôde ser validado como imagem.");
  }
}
