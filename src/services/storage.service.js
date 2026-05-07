import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

import sharp from 'sharp';

if (env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET
  });
}

export const uploadFile = async (filePath, folder = 'delivery_notes') => {
  let finalPath = filePath;
  let isTemp = false;

  if (folder === 'signatures' || filePath.match(/\.(jpg|jpeg|png)$/i)) {
    const optimizedPath = filePath.replace(/(\.[^.]+)$/, '_opt.webp');
    await sharp(filePath)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(optimizedPath);
    
    finalPath = optimizedPath;
    isTemp = true;
  }

  if (!env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️ Cloudinary not configured, using local storage fallback');
    const fileName = path.basename(finalPath);
    const destPath = path.join(process.cwd(), 'uploads', folder, fileName);
    
    if (!fs.existsSync(path.dirname(destPath))) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
    }
    
    fs.copyFileSync(finalPath, destPath);

    if (isTemp && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    
    return {
      url: `/uploads/${folder}/${fileName}`,
      public_id: fileName
    };
  }

  try {
    const result = await cloudinary.uploader.upload(finalPath, {
      folder: `bildyapp/${folder}`,
      resource_type: 'auto'
    });

    if (isTemp && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error);

    if (isTemp && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    throw error;
  }
};

export const deleteFile = async (publicId) => {
  if (!env.CLOUDINARY_CLOUD_NAME) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('❌ Cloudinary Delete Error:', error);
  }
};
