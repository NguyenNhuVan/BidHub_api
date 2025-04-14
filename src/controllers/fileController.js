const { uploadFile, getFile, deleteFile } = require('../utils/s3Client');

// Hàm để tạo tên file an toàn
const generateSafeFileName = (originalName) => {
  // Loại bỏ các ký tự đặc biệt và khoảng trắng
  const safeName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-');
  return safeName;
};

// Hàm để lấy tên file từ URL
const getFileNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Lấy phần sau của pathname (sau dấu / cuối cùng)
    return pathname.split('/').pop();
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};

// Controller để upload file
const uploadFileToS3 = async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body; // type có thể là 'avatar' hoặc 'post'
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileBuffer = file.buffer;
    const safeFileName = generateSafeFileName(file.originalname);
    let fileName;
    
    // Tạo tên file duy nhất dựa vào loại upload
    if (type === 'avatar') {
      fileName = `avatars/${req.user._id}-${Date.now()}-${safeFileName}`;
    } else if (type === 'post') {
      fileName = `posts/${req.user._id}/${Date.now()}-${safeFileName}`;
    } else {
      return res.status(400).json({ message: 'Invalid upload type' });
    }

    const mimeType = file.mimetype;

    const result = await uploadFile(fileBuffer, fileName, mimeType);
    
    // Đảm bảo URL được encode đúng cách
    const encodedUrl = encodeURI(result.url);
    
    res.status(200).json({ 
      message: 'File uploaded successfully', 
      url: encodedUrl,
      type: type,
      fileName: fileName
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Controller để get file
const getFileFromS3 = async (req, res) => {
  try {
    const { fileName } = req.params;
    const decodedFileName = decodeURIComponent(fileName);
    const fileStream = await getFile(decodedFileName);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller để delete file
const deleteFileFromS3 = async (req, res) => {
  try {
    const { fileName } = req.params;
    const decodedFileName = decodeURIComponent(fileName);
    const result = await deleteFile(decodedFileName);
    res.status(200).json({ message: 'File deleted successfully', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadFileToS3,
  getFileFromS3,
  deleteFileFromS3,
  getFileNameFromUrl,
};