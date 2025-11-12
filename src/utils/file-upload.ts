import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { USER_CONSTANTS } from '../constants/user.constants';

/**
 * Утилиты для работы с загрузкой и обработкой файлов
 */

// Создаем директорию для загрузок, если её нет
const uploadsDir = path.join(process.cwd(), USER_CONSTANTS.AVATAR.UPLOAD_PATH);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Настройка хранилища для multer
 * Используем memory storage, так как нам нужен userId из req.user после аутентификации
 */
const storage = multer.memoryStorage();

/**
 * Фильтр для валидации типов файлов
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Проверка MIME типа
  if (USER_CONSTANTS.AVATAR.ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(USER_CONSTANTS.ERRORS.INVALID_FILE_TYPE));
  }
};

/**
 * Настройка multer для загрузки аватаров
 */
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: USER_CONSTANTS.AVATAR.MAX_FILE_SIZE,
  },
});

/**
 * Обработка и оптимизация изображения
 */
export async function processAvatar(
  fileBuffer: Buffer,
  userId: number,
  originalExt: string
): Promise<{ original: string; thumbnail: string; medium: string; large: string }> {
  const userDir = path.join(uploadsDir, userId.toString());
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = originalExt.toLowerCase();
  const baseName = `original-${uniqueSuffix}`;
  const originalPath = path.join(userDir, `${baseName}${ext}`);
  
  // Читаем метаданные изображения
  const metadata = await sharp(fileBuffer).metadata();
  
  // Проверка минимального размера
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width < USER_CONSTANTS.AVATAR.MIN_WIDTH ||
    metadata.height < USER_CONSTANTS.AVATAR.MIN_HEIGHT
  ) {
    throw new Error(USER_CONSTANTS.ERRORS.IMAGE_TOO_SMALL);
  }

  const paths = {
    original: originalPath,
    thumbnail: path.join(userDir, `${baseName}-thumbnail${ext}`),
    medium: path.join(userDir, `${baseName}-medium${ext}`),
    large: path.join(userDir, `${baseName}-large${ext}`),
  };

  // Сохраняем оригинальное изображение
  await sharp(fileBuffer).toFile(originalPath);

  // Создаем разные размеры изображения
  await Promise.all([
    // Thumbnail (150x150)
    sharp(fileBuffer)
      .resize(
        USER_CONSTANTS.AVATAR.SIZES.thumbnail.width,
        USER_CONSTANTS.AVATAR.SIZES.thumbnail.height,
        {
          fit: 'cover',
          position: 'center',
        }
      )
      .jpeg({ quality: USER_CONSTANTS.AVATAR.QUALITY })
      .toFile(paths.thumbnail),
    
    // Medium (300x300)
    sharp(fileBuffer)
      .resize(
        USER_CONSTANTS.AVATAR.SIZES.medium.width,
        USER_CONSTANTS.AVATAR.SIZES.medium.height,
        {
          fit: 'cover',
          position: 'center',
        }
      )
      .jpeg({ quality: USER_CONSTANTS.AVATAR.QUALITY })
      .toFile(paths.medium),
    
    // Large (600x600)
    sharp(fileBuffer)
      .resize(
        USER_CONSTANTS.AVATAR.SIZES.large.width,
        USER_CONSTANTS.AVATAR.SIZES.large.height,
        {
          fit: 'cover',
          position: 'center',
        }
      )
      .jpeg({ quality: USER_CONSTANTS.AVATAR.QUALITY })
      .toFile(paths.large),
  ]);

  return paths;
}

/**
 * Удаление всех файлов аватара пользователя
 */
export async function deleteAvatarFiles(userId: number, avatarUrl: string | null): Promise<void> {
  if (!avatarUrl) {
    return;
  }

  try {
    const userDir = path.join(uploadsDir, userId.toString());
    
    if (fs.existsSync(userDir)) {
      // Удаляем все файлы в директории пользователя
      const files = fs.readdirSync(userDir);
      for (const file of files) {
        const filePath = path.join(userDir, file);
        fs.unlinkSync(filePath);
      }
      
      // Удаляем саму директорию
      fs.rmdirSync(userDir);
    }
  } catch (error) {
    console.error('Error deleting avatar files:', error);
    // Не выбрасываем ошибку, чтобы не блокировать другие операции
  }
}

/**
 * Генерация URL для аватара
 */
export function getAvatarUrl(userId: number, baseName: string, ext: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
  const sizeSuffix = size === 'thumbnail' ? '-thumbnail' : size === 'large' ? '-large' : '-medium';
  
  return `/uploads/avatars/${userId}/${baseName}${sizeSuffix}${ext}`;
}

/**
 * Получение базового имени файла из URL
 */
export function getBaseNameFromUrl(avatarUrl: string): { baseName: string; ext: string } | null {
  if (!avatarUrl) return null;
  
  const filename = path.basename(avatarUrl);
  // Удаляем суффикс размера (-thumbnail, -medium, -large)
  const baseName = filename.replace(/-(thumbnail|medium|large)/, '');
  const ext = path.extname(baseName);
  const nameWithoutExt = path.basename(baseName, ext);
  
  return { baseName: nameWithoutExt, ext };
}

