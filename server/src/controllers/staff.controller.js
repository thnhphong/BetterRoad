// ============================================
// server/src/controllers/staff.controller.js
// ============================================
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const registerStaff = async (req, res) => {
  try {
    const { name, email, password, phone, avatar, role = 'worker' } = req.body;
    const companyId = req.user.companyId; // From authenticated company user

    // Validate input
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Validate role
    const validRoles = ['worker', 'supervisor', 'admin'];
    if (role && !validRoles.includes(role)) {
      return errorResponse(res, `Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
    }

    // Check if email already exists in staff table
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('email')
      .eq('email', email)
      .single();

    if (existingStaff) {
      return errorResponse(res, 'Email already registered', 400);
    }

    // Check if email exists in companies table
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('email')
      .eq('email', email)
      .single();

    if (existingCompany) {
      return errorResponse(res, 'Email already registered as a company', 400);
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return errorResponse(res, authError.message || 'Failed to create account', 400);
    }

    // Create staff record
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        auth_user_id: authData.user.id,
        company_id: companyId,
        name: name,
        email: email,
        role: role,
        phone: phone || null,
        avatar: avatar || null,
        is_active: true,
      })
      .select()
      .single();

    if (staffError) {
      // Rollback: delete auth user if staff creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('Staff creation error:', staffError);
      console.error('Staff creation error details:', JSON.stringify(staffError, null, 2));
      return errorResponse(
        res,
        staffError.message || 'Failed to create staff profile',
        400,
        staffError
      );
    }

    return successResponse(
      res,
      {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        phone: staff.phone,
        avatar: staff.avatar,
        isActive: staff.is_active,
        companyId: staff.company_id,
        createdAt: staff.created_at,
      },
      'Staff registered successfully',
      201
    );
  } catch (error) {
    console.error('Register staff error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

export const getStaffList = async (req, res) => {
  try {
    const companyId = req.user.companyId; // From authenticated company user

    if (!companyId) {
      console.error('No company ID in request');
      return errorResponse(res, 'Company ID not found', 400);
    }

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get staff list error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return errorResponse(res, error.message || 'Failed to fetch staff list', 500);
    }

    // Handle null or undefined data
    const staffList = staff || [];

    // Transform data to match frontend expectations
    const formattedStaff = staffList.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      avatar: s.avatar,
      role: s.role,
      is_active: s.is_active,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));

    return successResponse(res, formattedStaff, 'Staff list retrieved successfully');
  } catch (error) {
    console.error('Get staff list error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(res, error.message || 'Failed to fetch staff list', 500);
  }
};

export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const companyId = req.user.companyId;

    // Verify staff belongs to the company
    const { data: staff, error: fetchError } = await supabase
      .from('staff')
      .select('company_id')
      .eq('id', id)
      .single();

    if (fetchError || !staff) {
      return errorResponse(res, 'Staff not found', 404);
    }

    if (staff.company_id !== companyId) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Update status
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update staff status error:', updateError);
      return errorResponse(res, 'Failed to update staff status', 500);
    }

    return successResponse(
      res,
      {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        is_active: updatedStaff.is_active,
      },
      'Staff status updated successfully'
    );
  } catch (error) {
    console.error('Update staff status error:', error);
    return errorResponse(res, 'Failed to update staff status', 500);
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Verify staff belongs to the company
    const { data: staff, error: fetchError } = await supabase
      .from('staff')
      .select('company_id, auth_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !staff) {
      return errorResponse(res, 'Staff not found', 404);
    }

    if (staff.company_id !== companyId) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Delete staff record
    const { error: deleteError } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete staff error:', deleteError);
      return errorResponse(res, 'Failed to delete staff', 500);
    }

    // Optionally delete auth user (uncomment if you want to delete the auth user too)
    // await supabase.auth.admin.deleteUser(staff.auth_user_id);

    return successResponse(res, null, 'Staff deleted successfully');
  } catch (error) {
    console.error('Delete staff error:', error);
    return errorResponse(res, 'Failed to delete staff', 500);
  }
};

export const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Fetch staff with tasks
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (staffError || !staff) {
      return errorResponse(res, 'Staff not found', 404);
    }

    // Verify staff belongs to the company
    if (staff.company_id !== companyId) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Fetch staff's tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        damage:damages(
          id,
          type,
          road:roads(name)
        )
      `)
      .eq('assigned_to', id)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Get tasks error:', tasksError);
    }

    // Format staff data
    const formattedStaff = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      avatar: staff.avatar,
      role: staff.role,
      is_active: staff.is_active,
      created_at: staff.created_at,
      updated_at: staff.updated_at,
    };

    // Calculate stats
    const stats = {
      total: tasks?.length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      in_progress: tasks?.filter(t => t.status === 'in_progress').length || 0,
      pending: tasks?.filter(t => t.status === 'pending' || t.status === 'assigned').length || 0,
    };

    return successResponse(
      res,
      {
        staff: formattedStaff,
        tasks: tasks || [],
        stats,
      },
      'Staff retrieved successfully'
    );
  } catch (error) {
    console.error('Get staff by ID error:', error);
    return errorResponse(res, 'Failed to fetch staff', 500);
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, avatar, role } = req.body;
    const companyId = req.user.companyId;

    // Verify staff belongs to the company
    const { data: staff, error: fetchError } = await supabase
      .from('staff')
      .select('company_id, email')
      .eq('id', id)
      .single();

    if (fetchError || !staff) {
      return errorResponse(res, 'Staff not found', 404);
    }

    if (staff.company_id !== companyId) {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== staff.email) {
      const { data: existingStaff } = await supabase
        .from('staff')
        .select('email')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existingStaff) {
        return errorResponse(res, 'Email already registered', 400);
      }

      const { data: existingCompany } = await supabase
        .from('companies')
        .select('email')
        .eq('email', email)
        .single();

      if (existingCompany) {
        return errorResponse(res, 'Email already registered as a company', 400);
      }
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['worker', 'supervisor', 'admin'];
      if (!validRoles.includes(role)) {
        return errorResponse(res, `Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
      }
    }

    // Build update object
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (role) updateData.role = role;

    // Update staff
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update staff error:', updateError);
      return errorResponse(res, 'Failed to update staff', 500);
    }

    // If email was changed, update auth user email
    if (email && email !== staff.email) {
      const { data: staffWithAuth } = await supabase
        .from('staff')
        .select('auth_user_id')
        .eq('id', id)
        .single();

      if (staffWithAuth?.auth_user_id) {
        const { error: authError } = await supabase.auth.admin.updateUserById(
          staffWithAuth.auth_user_id,
          { email }
        );

        if (authError) {
          console.error('Update auth email error:', authError);
          // Don't fail the request, just log the error
        }
      }
    }

    return successResponse(
      res,
      {
        id: updatedStaff.id,
        name: updatedStaff.name,
        email: updatedStaff.email,
        phone: updatedStaff.phone,
        avatar: updatedStaff.avatar,
        role: updatedStaff.role,
        is_active: updatedStaff.is_active,
        updated_at: updatedStaff.updated_at,
      },
      'Staff updated successfully'
    );
  } catch (error) {
    console.error('Update staff error:', error);
    return errorResponse(res, 'Failed to update staff', 500);
  }
};

