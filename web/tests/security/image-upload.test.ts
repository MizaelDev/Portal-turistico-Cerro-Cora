import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  ImageUploadError,
  maxOutputDimension,
  normalizeUploadedImage,
} from "../../src/lib/image-upload";

function imageFile(name: string, type: string, data: Buffer) {
  return {
    name,
    type,
    size: data.byteLength,
    async arrayBuffer(): Promise<ArrayBuffer> {
      const copy = new Uint8Array(data.byteLength);
      copy.set(data);
      return copy.buffer;
    },
  };
}

test("normaliza imagem legítima para WebP, limita dimensões e remove metadados", async () => {
  const source = await sharp({
    create: { width: 3200, height: 1800, channels: 3, background: "#21473c" },
  })
    .jpeg({ quality: 90 })
    .withMetadata({ orientation: 6 })
    .toBuffer();

  const result = await normalizeUploadedImage(imageFile("paisagem.jpg", "image/jpeg", source));
  const metadata = await sharp(result.data).metadata();

  assert.equal(result.contentType, "image/webp");
  assert.equal(result.extension, "webp");
  assert.ok((metadata.width || 0) <= maxOutputDimension);
  assert.ok((metadata.height || 0) <= maxOutputDimension);
  assert.equal(metadata.exif, undefined);
});

test("rejeita MIME não permitido e conteúdo que não é imagem", async () => {
  await assert.rejects(
    normalizeUploadedImage(imageFile("arquivo.gif", "image/gif", Buffer.from("GIF89a"))),
    ImageUploadError,
  );
  await assert.rejects(
    normalizeUploadedImage(imageFile("falso.jpg", "image/jpeg", Buffer.from("não é uma imagem"))),
    ImageUploadError,
  );
  await assert.rejects(
    normalizeUploadedImage(
      imageFile("vetor.jpg", "image/jpeg", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),
    ),
    ImageUploadError,
  );
});

test("rejeita imagens acima do limite de pixels mesmo quando comprimidas", async () => {
  const oversized = await sharp({
    create: { width: 5000, height: 5000, channels: 3, background: "#ffffff" },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await assert.rejects(
    normalizeUploadedImage(imageFile("grande.png", "image/png", oversized)),
    ImageUploadError,
  );
});
