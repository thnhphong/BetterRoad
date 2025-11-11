import supabase from '../config/supabase.js';

/**
 * Register - Dùng Supabase Auth
 */
export const register = async (req, res) => {
  try {
    const { companyName, email, password, phone, address } = req.body;

    // Validation
    if (!companyName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Step 1: Create auth user với Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Cần xác nhận email
      user_metadata: {
        company_name: companyName
      }
    });

    if (authError) throw authError;

    // Step 2: Tạo company record
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        auth_user_id: authData.user.id,
        name: companyName,
        email,
        phone: phone || null,
        address: address || null
      })
      .select()
      .single();

    if (companyError) {
      // Rollback: xóa auth user nếu tạo company thất bại
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw companyError;
    }

    // Step 3: Tạo admin user
    const { error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        company_id: companyData.id,
        name: `${companyName} Admin`,
        email,
        role: 'admin',
        phone: phone || null,
        is_active: true
      });

    if (userError) {
      // Rollback
      await supabase.from('companies').delete().eq('id', companyData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận.',
      user: {
        id: companyData.id,
        name: companyData.name,
        email: companyData.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Đăng ký thất bại'
    });
  }
};

/**
 * Login - Dùng Supabase Auth
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Step 1: Đăng nhập với Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) throw authError;

    // Step 2: Lấy thông tin user từ database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError) throw userError;

    // Step 3: Check role (chỉ admin/supervisor được login web)
    if (!['admin', 'supervisor'].includes(userData.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập'
      });
    }

    // Step 4: Check active status
    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      session: authData.session,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        company: userData.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message?.includes('Invalid login credentials')) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }
    
    if (error.message?.includes('Email not confirmed')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng xác nhận email trước khi đăng nhập'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Đăng nhập thất bại'
    });
  }
};

/**
 * Get current user
 */
export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token với Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) throw authError;

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (userError) throw userError;

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.admin.signOut(token);
    }

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Đăng xuất thất bại'
    });
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Email khôi phục mật khẩu đã được gửi'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Gửi email thất bại'
    });
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !password) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const { error } = await supabase.auth.updateUser(
      { password },
      { accessToken: token }
    );

    if (error) throw error;

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đổi mật khẩu thất bại'
    });
  }
};
