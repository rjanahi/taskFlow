import { join } from 'node:path';

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const ATTACHMENT_MIME_TYPE_PATTERN = /^image\/(jpeg|png|webp)$/;

export const ATTACHMENT_STORAGE_DIRECTORY = join(
  process.cwd(),
  'storage',
  'attachments',
);

export const ATTACHMENT_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
