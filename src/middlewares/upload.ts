import multer, { Multer } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from "cloudinary";

declare global {
    namespace Express {
        interface Request {
            imageUrl?: string;
        }
    }
}

const storage = multer.memoryStorage();
const uploadImage: Multer = multer({ storage });

const uploadToCloudinary = async (fileBuffer: Buffer): Promise<string> => {
    const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${fileBuffer.toString('base64')}`
    );
    return result.secure_url;
};

const upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    uploadImage.single('image')(req, res, async (err) => {
        if (err) {
            console.log("Yükleme hatası:", err);
            return next(err);
        }

        try {
            if (req.file) {
                const imageUrl = await uploadToCloudinary(req.file.buffer);
                req.imageUrl = imageUrl;
            }

            next();
        } catch (uploadError) {
            console.log("Cloudinary yükleme hatası:", uploadError);
            return next(uploadError);
        }
    });
};

export const deleteFromCloudinary = async (imageUrl: string) => {
    const regex = /\/upload\/v\d+\/(.+?)\./;
    const matches = imageUrl.match(regex);

    if (!matches || matches.length < 2) {
        throw new Error('Geçersiz Cloudinary URL\'si');
    }

    const publicId = matches[1];
    console.log("Görselin public_id'si: ", publicId);

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'not found') {
            console.error("Cloudinary üzerinde görsel bulunamadı.");
        } else {
            console.log('Görsel başarıyla silindi:', result);
        }
    } catch (err) {
        console.error('Görsel silme hatası:', err);
        throw new Error('Cloudinary görsel silme hatası');
    }
};

export default upload;
