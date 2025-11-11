import supabase from '../config/supabase.js';

// Get all roads
export const getAllRoads = async (req, res) => {
  try {
    const { company_id } = req.query;
    
    let query = supabase
      .from('roads')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by company if provided
    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    const { data: roads, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: roads.length,
      data: roads
    });
  } catch (error) {
    console.error('Get roads error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đường',
      error: error.message
    });
  }
};

// Create road
export const createRoad = async (req, res) => {
  try {
    const { name, code, description, length_km, status, geom } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tên đường là bắt buộc'
      });
    }

    const { data: road, error } = await supabase
      .from('roads')
      .insert([{
        company_id: req.user.id,
        name,
        code,
        description,
        length_km: length_km || null,
        status: status || 'good',
        geom: geom || null
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Tạo tuyến đường thành công',
      data: road
    });
  } catch (error) {
    console.error('Create road error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tuyến đường',
      error: error.message
    });
  }
};

// Get single road
export const getRoad = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: road, error } = await supabase
      .from('roads')
      .select(`
        *,
        damages:damages(count)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!road) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường'
      });
    }

    res.json({
      success: true,
      data: road
    });
  } catch (error) {
    console.error('Get road error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đường',
      error: error.message
    });
  }
};

// Update road
export const updateRoad = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.company_id;
    delete updates.created_at;

    const { data: road, error } = await supabase
      .from('roads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!road) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tuyến đường'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật tuyến đường thành công',
      data: road
    });
  } catch (error) {
    console.error('Update road error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật',
      error: error.message
    });
  }
};

// Delete road
export const deleteRoad = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('roads')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Xóa tuyến đường thành công'
    });
  } catch (error) {
    console.error('Delete road error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa',
      error: error.message
    });
  }
};