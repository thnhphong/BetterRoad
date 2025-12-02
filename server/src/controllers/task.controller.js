// ============================================
// server/src/controllers/task.controller.js
// ============================================
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      damage_id,
      assigned_to,
      priority = 'medium',
      type,
      due_date,
      notes
    } = req.body;
    const companyId = req.user.companyId; // From authenticated company user

    // Validate required fields
    if (!title || !title.trim()) {
      return errorResponse(res, 'Title is required', 400);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return errorResponse(res, `Invalid priority. Must be one of: ${validPriorities.join(', ')}`, 400);
    }

    // Validate type (if provided)
    const validTypes = ['repair', 'survey'];
    if (type && !validTypes.includes(type)) {
      return errorResponse(res, `Invalid type. Must be one of: ${validTypes.join(', ')}`, 400);
    }

    // Normalize empty strings to null
    const normalizedDamageId = damage_id && damage_id.trim() !== '' ? damage_id : null;
    const normalizedAssignedTo = assigned_to && assigned_to.trim() !== '' ? assigned_to : null;

    // If damage_id is provided, verify it belongs to the company
    if (normalizedDamageId) {
      const { data: damage, error: damageError } = await supabase
        .from('damages')
        .select('id, company_id')
        .eq('id', normalizedDamageId)
        .single();

      if (damageError) {
        console.error('Damage lookup error:', damageError);
        return errorResponse(res, `Damage not found: ${damageError.message}`, 404);
      }

      if (!damage) {
        return errorResponse(res, 'Damage not found', 404);
      }

      if (damage.company_id !== companyId) {
        return errorResponse(res, 'Unauthorized: Damage does not belong to your company', 403);
      }
    }

    // If assigned_to is provided, verify it's a staff member of the company
    if (normalizedAssignedTo) {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, company_id')
        .eq('id', normalizedAssignedTo)
        .single();

      if (staffError) {
        console.error('Staff lookup error:', staffError);
        return errorResponse(res, `Staff member not found: ${staffError.message}`, 404);
      }

      if (!staff) {
        return errorResponse(res, 'Staff member not found', 404);
      }

      if (staff.company_id !== companyId) {
        return errorResponse(res, 'Unauthorized: Staff member does not belong to your company', 403);
      }
    }

    // Get current user's company info for created_by
    // Since we're using company authentication, we'll use the company's auth_user_id
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('auth_user_id')
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error('Company lookup error:', companyError);
      return errorResponse(res, 'Failed to get company information', 500);
    }

    // Note: The schema shows assigned_to and created_by reference users(id),
    // but since only staff table exists, we'll use staff IDs.
    // If your database has a users table, adjust accordingly.
    // For now, we'll use the staff ID directly for assigned_to
    // and company's auth_user_id for created_by (which might need adjustment based on your actual schema)

    // Prepare insert data
    // Note: created_by is set to null because the foreign key references users(id) which doesn't exist
    // Run the SQL script server/sql/fix_tasks_foreign_keys.sql to fix the foreign key constraints
    const insertData = {
      company_id: companyId,
      damage_id: normalizedDamageId,
      assigned_to: normalizedAssignedTo, // This will work if foreign key is fixed to reference staff(id)
      created_by: null, // Temporarily set to null to avoid foreign key constraint error
      // After fixing foreign keys, you can use: created_by: company?.auth_user_id || null
      title: title.trim(),
      description: description?.trim() || null,
      type: type || 'repair',
      status: 'pending',
      priority: priority,
      due_date: due_date || null,
      notes: notes?.trim() || null,
    };

    console.log('Creating task with data:', JSON.stringify(insertData, null, 2));

    // Create task record
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();

    if (taskError) {
      console.error('Create task error:', taskError);
      console.error('Create task error details:', JSON.stringify(taskError, null, 2));
      console.error('Insert data that failed:', JSON.stringify(insertData, null, 2));

      // Check for foreign key constraint errors
      if (taskError.code === '23503') {
        if (taskError.message.includes('damage_id')) {
          return errorResponse(res, 'Invalid damage ID. The damage does not exist.', 400);
        }
        if (taskError.message.includes('assigned_to')) {
          return errorResponse(res, 'Invalid staff ID. The staff member does not exist.', 400);
        }
        if (taskError.message.includes('created_by')) {
          return errorResponse(res, 'Invalid user ID for created_by field.', 400);
        }
        return errorResponse(res, 'Foreign key constraint violation. Please check the linked records.', 400);
      }

      return errorResponse(
        res,
        taskError.message || 'Failed to create task',
        400,
        taskError
      );
    }

    return successResponse(
      res,
      task,
      'Task created successfully',
      201
    );
  } catch (error) {
    console.error('Create task error:', error);
    return errorResponse(res, 'Failed to create task', 500);
  }
};

export const getTasks = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        damage:damages(
          id,
          title,
          severity,
          status,
          road:roads(id, name, code)
        ),
        assigned_staff:staff!tasks_assigned_to_fkey(
          id,
          name,
          email,
          role,
          avatar
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get tasks error:', error);
      return errorResponse(res, error.message || 'Failed to fetch tasks', 500);
    }

    return successResponse(res, tasks || [], 'Tasks retrieved successfully');
  } catch (error) {
    console.error('Get tasks error:', error);
    return errorResponse(res, 'Failed to fetch tasks', 500);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      damage_id,
      assigned_to,
      status,
      priority,
      type,
      due_date,
      started_at,
      completed_at,
      notes
    } = req.body;
    const companyId = req.user.companyId;

    // Verify task belongs to company
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, company_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return errorResponse(res, 'Task not found', 404);
    }

    if (existingTask.company_id !== companyId) {
      return errorResponse(res, 'Unauthorized: Task does not belong to your company', 403);
    }

    // Build update object
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (damage_id !== undefined) updates.damage_id = damage_id || null;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (started_at !== undefined) updates.started_at = started_at || null;
    if (completed_at !== undefined) updates.completed_at = completed_at || null;
    if (notes !== undefined) updates.notes = notes || null;
    if (type !== undefined) updates.type = type || null;
    updates.updated_at = new Date().toISOString();

    // If assigned_to is provided, verify it's a staff member of the company
    if (assigned_to) {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, company_id')
        .eq('id', assigned_to)
        .single();

      if (staffError || !staff) {
        return errorResponse(res, 'Staff member not found', 404);
      }

      if (staff.company_id !== companyId) {
        return errorResponse(res, 'Unauthorized: Staff member does not belong to your company', 403);
      }
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update task error:', error);
      return errorResponse(res, error.message || 'Failed to update task', 500);
    }

    return successResponse(res, task, 'Task updated successfully');
  } catch (error) {
    console.error('Update task error:', error);
    return errorResponse(res, 'Failed to update task', 500);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Verify task belongs to company
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, company_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return errorResponse(res, 'Task not found', 404);
    }

    if (existingTask.company_id !== companyId) {
      return errorResponse(res, 'Unauthorized: Task does not belong to your company', 403);
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete task error:', error);
      return errorResponse(res, error.message || 'Failed to delete task', 500);
    }

    return successResponse(res, null, 'Task deleted successfully');
  } catch (error) {
    console.error('Delete task error:', error);
    return errorResponse(res, 'Failed to delete task', 500);
  }
};

export const getStaffForTasks = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { data: staff, error } = await supabase
      .from('staff')
      .select('id, name, email, role, avatar, is_active')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Get staff error:', error);
      return errorResponse(res, error.message || 'Failed to fetch staff', 500);
    }

    return successResponse(res, staff || [], 'Staff retrieved successfully');
  } catch (error) {
    console.error('Get staff error:', error);
    return errorResponse(res, 'Failed to fetch staff', 500);
  }
};

export const getDamagesForTasks = async (req, res) => {
  try {
    console.log('=== getDamagesForTasks START ===');
    console.log('Request method:', req.method);
    console.log('Request path:', req.path);
    console.log('Request user exists:', !!req.user);
    console.log('Request user:', req.user ? JSON.stringify(req.user, null, 2) : 'null');

    const companyId = req.user?.companyId;

    if (!companyId) {
      console.error('No company ID in request');
      console.error('Request user object:', JSON.stringify(req.user, null, 2));
      return errorResponse(res, 'Company ID not found', 400);
    }

    console.log('Fetching damages for company:', companyId);

    // Try the simplest possible query first
    console.log('Step 1: Querying damages table (basic)...');
    let damagesSimple = null;
    let simpleError = null;

    try {
      const result = await supabase
        .from('damages')
        .select('id, title, severity, status, road_id')
        .eq('company_id', companyId)
        .in('status', ['pending', 'assigned', 'in_progress'])
        .order('created_at', { ascending: false });

      damagesSimple = result.data;
      simpleError = result.error;

      console.log('Step 1 result:', {
        hasData: !!damagesSimple,
        dataLength: damagesSimple?.length || 0,
        dataType: Array.isArray(damagesSimple) ? 'array' : typeof damagesSimple,
        hasError: !!simpleError,
        errorType: simpleError ? typeof simpleError : 'none'
      });
    } catch (queryError) {
      console.error('Step 1 exception:', queryError);
      console.error('Step 1 exception stack:', queryError.stack);
      return errorResponse(res, `Query exception: ${queryError.message}`, 500);
    }

    if (simpleError) {
      console.error('Get damages error:', simpleError);
      console.error('Error code:', simpleError.code);
      console.error('Error message:', simpleError.message);
      console.error('Error details:', JSON.stringify(simpleError, null, 2));
      console.error('Error hint:', simpleError.hint);
      return errorResponse(res, simpleError.message || 'Failed to fetch damages', 500);
    }

    if (!damagesSimple) {
      console.log('damagesSimple is null, returning empty array');
      return successResponse(res, [], 'Damages retrieved successfully');
    }

    if (!Array.isArray(damagesSimple)) {
      console.error('damagesSimple is not an array:', typeof damagesSimple, damagesSimple);
      return errorResponse(res, 'Invalid data format returned from database', 500);
    }

    if (damagesSimple.length === 0) {
      console.log('No damages found, returning empty array');
      return successResponse(res, [], 'Damages retrieved successfully');
    }

    console.log('Found', damagesSimple.length, 'damages');
    console.log('Sample damage:', JSON.stringify(damagesSimple[0], null, 2));

    // Fetch roads separately if we have road_ids
    const roadIds = damagesSimple
      .map(d => d?.road_id)
      .filter(id => id !== null && id !== undefined && id !== '');

    console.log('Road IDs to fetch:', roadIds);

    let roads = [];
    if (roadIds.length > 0) {
      console.log('Step 2: Querying roads table...');
      try {
        const roadsResult = await supabase
          .from('roads')
          .select('id, name, code')
          .in('id', roadIds)
          .eq('company_id', companyId);

        console.log('Step 2 result:', {
          hasData: !!roadsResult.data,
          dataLength: roadsResult.data?.length || 0,
          hasError: !!roadsResult.error
        });

        if (roadsResult.error) {
          console.error('Get roads error:', roadsResult.error);
          console.error('Roads error details:', JSON.stringify(roadsResult.error, null, 2));
          // Continue without roads if this fails
        } else {
          roads = roadsResult.data || [];
          console.log('Found', roads.length, 'roads');
        }
      } catch (roadsQueryError) {
        console.error('Roads query exception:', roadsQueryError);
        // Continue without roads
      }
    } else {
      console.log('No road IDs to fetch');
    }

    // Map roads to damages
    console.log('Step 3: Mapping roads to damages...');
    const damages = damagesSimple.map(damage => {
      const road = damage.road_id ? (roads.find(r => r.id === damage.road_id) || null) : null;
      return {
        id: damage.id,
        title: damage.title,
        severity: damage.severity,
        status: damage.status,
        road: road
      };
    });

    console.log('Final damages count:', damages.length);
    if (damages.length > 0) {
      console.log('Sample final damage:', JSON.stringify(damages[0], null, 2));
    }
    console.log('=== getDamagesForTasks END ===');

    return successResponse(res, damages, 'Damages retrieved successfully');
  } catch (error) {
    console.error('=== getDamagesForTasks CATCH ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return errorResponse(res, error.message || 'Failed to fetch damages', 500);
  }
};

