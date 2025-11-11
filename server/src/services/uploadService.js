const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const uploadImage = async (file) => {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `damages/${fileName}`;

    const { data, error } = await supabase.storage
      .from('damages-images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('damages-images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const deleteImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('damages-images')
      .remove([filePath]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

module.exports = { uploadImage, deleteImage };