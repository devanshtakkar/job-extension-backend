import { Router } from 'express';
import { StorageService } from '../lib/storage.service';
import { authMiddleware, requireVerified } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all resume routes
router.use([authMiddleware, requireVerified]);

/**
 * GET /api/resume/upload-url
 * Get a signed URL for uploading a resume
 */
router.get('/upload-url', async (req, res) => {
  try {
    const { fileName, contentType } = req.query;
    const userId = req.user!.userId; // Safely typed due to auth middleware

    if (!fileName || !contentType) {
      res.status(400).json({
        error: 'Missing required parameters: fileName and contentType are required'
      });
      return;
    }

    const uploadData = await StorageService.generateUploadUrl(
      userId,
      fileName as string,
      contentType as string
    );

    res.json(uploadData);
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      error: 'Failed to generate upload URL'
    });
  }
});

/**
 * GET /api/resume/:fileId
 * Get a signed URL for accessing a resume
 */
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;

    const signedUrl = await StorageService.generateReadSignedUrl(userId, fileId);
    res.json({ signedUrl });
  } catch (error) {
    console.error('Error generating read URL:', error);
    res.status(404).json({
      error: 'File not found or access denied'
    });
  }
});

/**
 * GET /api/resume
 * List all resumes for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const files = await StorageService.listUserFiles(userId);
    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      error: 'Failed to list files'
    });
  }
});

/**
 * DELETE /api/resume/:fileId
 * Delete a resume
 */
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user!.userId;

    await StorageService.deleteFile(userId, fileId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(404).json({
      error: 'File not found or access denied'
    });
  }
});

export default router;
