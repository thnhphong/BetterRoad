import supabase from '../config/supabase.js';

// Get all tasks with filters
export const getAllTasks = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      assigned_to, 
      damage_id,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = supabase
      .from('tasks')
      .select(`
        *,
        damage:damages(id, type, severity, road:roads(name)),
        assigned_to_user:users!assigned_to(id, name),
        created_by_user:users!created_by(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (damage_id) query = query.eq('damage_id', damage_id);

    const { data: tasks, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      count: tasks.length,
      total: count,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách công việc',
      error: error.message
    });
  }
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const {
      damage_id,
      title,
      description,
      priority,
      assigned_to,
      start_date,
      due_date
    } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề công việc là bắt buộc'
      });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{
        damage_id: damage_id || null,
        title,
        description,
        priority: priority || 'medium',
        assigned_to: assigned_to || null,
        created_by: req.user.id,
        status: 'pending',
        start_date: start_date || null,
        due_date: due_date || null
      }])
      .select(`
        *,
        damage:damages(id, type, severity),
        assigned_to_user:users!assigned_to(id, name)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Tạo công việc thành công',
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo công việc',
      error: error.message
    });
  }
};

// Get single task
export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        damage:damages(
          id, 
          type, 
          severity, 
          description,
          image_url,
          road:roads(id, name, code)
        ),
        assigned_to_user:users!assigned_to(id, name, email, phone),
        created_by_user:users!created_by(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin',
      error: error.message
    });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_by;
    delete updates.created_at;

    const { data: task, error } = await supabase
      .from('tasks')
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
      message: 'Cập nhật công việc thành công',
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật',
      error: error.message
    });
  }
};

// Update task status only
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // If status is completed, set completed_at
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: task
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái',
      error: error.message
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Xóa công việc thành công'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa',
      error: error.message
    });
  }
};