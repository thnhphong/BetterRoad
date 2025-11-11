import supabase from '../config/supabase.js';

// Get all damages with filters
export const getAllDamages = async (req, res) => {
  try {
    const { status, severity, type, road_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('damages')
      .select(`
        *,
        road:roads(id, name, code),
        detected_by_user:users!detected_by(id, name)
      `)
      .order('detected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);
    if (type) query = query.eq('type', type);
    if (road_id) query = query.eq('road_id', road_id);

    const { data: damages, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: damages.length,
      total: count,
      data: damages
    });
  } catch (error) {
    console.error('Get damages error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hư hỏng',
      error: error.message
    });
  }
};

// Create new damage report
export const createDamage = async (req, res) => {
  try {
    const {
      road_id,
      type,
      severity,
      latitude,
      longitude,
      description,
      image_url,
      video_url
    } = req.body;

    // Validation
    if (!type || !severity || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Create GeoJSON point
    const geom = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    const { data: damage, error } = await supabase
      .from('damages')
      .insert([{
        road_id: road_id || null,
        type,
        severity,
        geom: `POINT(${longitude} ${latitude})`,
        description,
        image_url: image_url || null,
        video_url: video_url || null,
        detected_by: req.user.id,
        status: 'pending'
      }])
      .select(`
        *,
        road:roads(id, name, code)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Báo cáo hư hỏng thành công',
      data: damage
    });
  } catch (error) {
    console.error('Create damage error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo báo cáo',
      error: error.message
    });
  }
};

// Get single damage
export const getDamage = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: damage, error } = await supabase
      .from('damages')
      .select(`
        *,
        road:roads(id, name, code, status),
        detected_by_user:users!detected_by(id, name, email),
        tasks:tasks(id, title, status, assigned_to)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!damage) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hư hỏng'
      });
    }

    res.json({
      success: true,
      data: damage
    });
  } catch (error) {
    console.error('Get damage error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin',
      error: error.message
    });
  }
};

// Update damage
export const updateDamage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.detected_by;
    delete updates.detected_at;
    delete updates.geom; // Geometry shouldn't be updated directly

    const { data: damage, error } = await supabase
      .from('damages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật hư hỏng thành công',
      data: damage
    });
  } catch (error) {
    console.error('Update damage error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật',
      error: error.message
    });
  }
};

// Delete damage
export const deleteDamage = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('damages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Xóa hư hỏng thành công'
    });
  } catch (error) {
    console.error('Delete damage error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa',
      error: error.message
    });
  }
};

// Upload damage image
export const uploadDamageImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url } = req.body;

    const { data: damage, error } = await supabase
      .from('damages')
      .update({ image_url })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Upload ảnh thành công',
      data: damage
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi upload ảnh',
      error: error.message
    });
  }
};