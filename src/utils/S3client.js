// Import các module cần thiết từ @aws-sdk/client-s3
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

// Load biến môi trường từ file .env
dotenv.config();

// Kiểm tra các biến môi trường bắt buộc
const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Khởi tạo cấu hình S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Tên bucket từ biến môi trường
const bucketName = process.env.AWS_S3_BUCKET;

// Hàm tạo URL an toàn
const createSecureUrl = (fileName) => {
  // Encode từng phần của path
  const encodedFileName = fileName.split('/').map(part => encodeURIComponent(part)).join('/');
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedFileName}`;
};

// Hàm upload file lên S3
const uploadFile = async (fileBuffer, fileName, mimeType) => {
  try {
    // Validate input
    if (!fileBuffer || !fileName || !mimeType) {
      throw new Error('Missing required parameters for upload');
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read', // Thêm quyền public-read
    };

    // Log thông tin debug
    console.log('[DEBUG] Upload params:', {
      Bucket: bucketName,
      Key: fileName,
      ContentType: mimeType,
      FileSize: fileBuffer?.length,
      Region: process.env.AWS_REGION
    });

    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);

    // Tạo URL an toàn
    const fileUrl = createSecureUrl(fileName);
    
    console.log('[DEBUG] Upload successful:', {
      url: fileUrl,
      etag: result.ETag
    });

    return { success: true, url: fileUrl, result };
  } catch (error) {
    console.error('[ERROR] Upload failed:', {
      error: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId
    });
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// Hàm get (download) file từ S3
const getFile = async (fileName) => {
  try {
    if (!fileName) {
      throw new Error('fileName is required');
    }

    const getParams = {
      Bucket: bucketName,
      Key: fileName,
    };

    const command = new GetObjectCommand(getParams);
    const result = await s3Client.send(command);

    return result.Body;
  } catch (error) {
    console.error('[ERROR] Get file failed:', {
      fileName,
      error: error.message,
      code: error.code
    });
    throw new Error(`Failed to get file from S3: ${error.message}`);
  }
};

// Hàm xóa file trên S3
const deleteFile = async (fileName) => {
  try {
    if (!fileName) {
      throw new Error('fileName is required');
    }

    const deleteParams = {
      Bucket: bucketName,
      Key: fileName,
    };

    const command = new DeleteObjectCommand(deleteParams);
    const result = await s3Client.send(command);

    console.log('[DEBUG] Delete successful:', {
      fileName,
      requestId: result.$metadata?.requestId
    });

    return { success: true, result };
  } catch (error) {
    console.error('[ERROR] Delete failed:', {
      fileName,
      error: error.message,
      code: error.code
    });
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

// Export các hàm để sử dụng ở nơi khác
module.exports = {
  uploadFile,
  getFile,
  deleteFile,
};