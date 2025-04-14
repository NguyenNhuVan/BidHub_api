const express = require('express');
const router = express.Router();
const { uploadFileToS3, getFileFromS3, deleteFileFromS3 } = require('../controllers/fileController');
const upload = require('../middlewares/upload');
const authenticate = require('../middlewares/authenticate');

// Route để upload file (yêu cầu xác thực)
router.post('/upload', authenticate, upload.single('file'), uploadFileToS3);

// Route để get file (không yêu cầu xác thực vì có thể cần hiển thị công khai)
router.get('/file/:fileName', getFileFromS3);

// Route để delete file (yêu cầu xác thực)
router.delete('/file/:fileName', authenticate, deleteFileFromS3);

module.exports = router;