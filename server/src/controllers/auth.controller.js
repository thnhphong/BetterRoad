// ============================================
// server/src/controllers/auth.controller.js
// ============================================
import { supabase } from '../config/supabase.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters', 400);
    }

    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      return errorResponse(res, 'Server configuration error. Please contact support.', 500);
    }

    // Check if email already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('email')
      .eq('email', email)
      .single();

    if (existingCompany) {
      return errorResponse(res, 'Email already registered', 400);
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

    // Create company record
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        auth_user_id: authData.user.id,
        name: name,
        email,
        phone: phone || null,
        address: address || null,
        is_active: true,
      })
      .select()
      .single();

    if (companyError) {
      // Rollback: delete auth user if company creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error('Company creation error:', companyError);
      console.error('Company creation error details:', JSON.stringify(companyError, null, 2));
      return errorResponse(
        res,
        companyError.message || 'Failed to create company profile',
        400,
        companyError
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: authData.user.id,
      companyId: company.id,
      email: company.email,
    });

    return successResponse(
      res,
      {
        token,
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          address: company.address,
        },
      },
      'Company registered successfully',
      201
    );
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse(res, 'Registration failed', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (companyError || !company) {
      return errorResponse(res, 'Company not found', 404);
    }

    if (!company.is_active) {
      return errorResponse(res, 'Company account is inactive', 403);
    }

    // Generate JWT token
    const token = generateToken({
      userId: authData.user.id,
      companyId: company.id,
      email: company.email,
    });

    return successResponse(res, {
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
      },
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

export const getProfile = async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', req.user.companyId)
      .single();

    if (error) {
      return errorResponse(res, 'Company not found', 404);
    }

    return successResponse(res, {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      isActive: company.is_active,
      createdAt: company.created_at,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return errorResponse(res, 'Failed to get profile', 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', req.user.companyId)
      .single();

    if (error) {
      return errorResponse(res, 'Company not found', 404);
    }

    // Return in format expected by ProtectedRoute
    return successResponse(res, {
      user: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        isActive: company.is_active,
        role: 'admin', // Default role for company accounts
        createdAt: company.created_at,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    return errorResponse(res, 'Failed to get user info', 500);
  }
};