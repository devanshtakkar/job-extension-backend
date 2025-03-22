import { Storage } from '@google-cloud/storage';
import { AuthService } from './auth.service';
import prisma from './prisma';

const storage = new Storage();
const BUCKET_NAME = process.env.GCP_BUCKET_NAME || 'your-bucket-name';
const bucket = storage.bucket(BUCKET_NAME);

export class StorageService {
  /**
   * Generate a signed URL for uploading a file
   * @param userId - The ID of the user requesting the upload
   * @param fileName - Original name of the file
   * @param contentType - MIME type of the file
   * @returns Signed URL and file metadata
   */
  static async generateUploadUrl(userId: number, fileName: string, contentType: string) {
    // Create a unique file ID using timestamp and random string
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const extension = fileName.split('.').pop();
    const objectName = `resumes/${userId}/${fileId}.${extension}`;

    const [url] = await bucket.file(objectName).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
      contentType,
    });

    // Create resume entry in database
    await prisma.userResume.create({
      data: {
        userId,
        resume_name: fileName,
        details: {},
        file_id: objectName,
        resume_url: `https://storage.googleapis.com/${BUCKET_NAME}/${objectName}`,
        uploaded_at: new Date(),
      },
    });

    return {
      uploadUrl: url,
      fileId: objectName,
      publicUrl: `https://storage.googleapis.com/${BUCKET_NAME}/${objectName}`,
    };
  }

  /**
   * Generate a signed URL for downloading/viewing a file
   * @param userId - The ID of the user requesting access
   * @param fileId - The file's object name in storage
   * @returns Signed URL for accessing the file
   */
  static async generateReadSignedUrl(userId: number, fileId: string) {
    // Check if user owns the file
    const resume = await prisma.userResume.findFirst({
      where: {
        userId,
        file_id: fileId,
      },
    });

    if (!resume) {
      throw new Error('File not found or access denied');
    }

    const [url] = await bucket.file(fileId).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // URL expires in 1 hour
    });

    return url;
  }

  /**
   * Delete a file from storage
   * @param userId - The ID of the user requesting deletion
   * @param fileId - The file's object name in storage
   */
  static async deleteFile(userId: number, fileId: string) {
    // Check if user owns the file
    const resume = await prisma.userResume.findFirst({
      where: {
        userId,
        file_id: fileId,
      },
    });

    if (!resume) {
      throw new Error('File not found or access denied');
    }

    // Delete from storage
    await bucket.file(fileId).delete();

    // Delete from database
    await prisma.userResume.delete({
      where: {
        id: resume.id,
      },
    });
  }

  /**
   * List all files for a user
   * @param userId - The ID of the user
   * @returns Array of file metadata
   */
  static async listUserFiles(userId: number) {
    const resumes = await prisma.userResume.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return resumes;
  }
}
