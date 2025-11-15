import supabase from '../config/supabase.js';
/**
 * REGISTER - Đăng ký tài khoản mới
 */
export const register = async (req, res) => {
  try {
    const { companyName, email, password, phone, address } = req.body;

    // Validation
    if (!companyName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Step 1: Tạo Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm cho demo, set false cho production
      user_metadata: {
        company_name: companyName,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw authError;
    }

    console.log('✅ Created auth user:', authData.user.id);

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
      console.error('Company creation error:', companyError);
      // Rollback: xóa auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw companyError;
    }

    console.log('✅ Created company:', companyData.id);

    // Step 3: Tạo admin user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        company_id: companyData.id,
        name: `${companyName} Admin`,
        email,
        role: 'admin',
        phone: phone || null,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      // Rollback: xóa company và auth user
      await supabase.from('companies').delete().eq('id', companyData.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    console.log('✅ Created user:', userData.id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Bạn có thể đăng nhập ngay.',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        company: companyData.name
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký'
      });
    }
    
    if (error.message?.includes('User already registered')) {
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
 * LOGIN - Đăng nhập
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

    // Step 1: Xác thực với Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    console.log('✅ Auth successful:', authData.user.id);

    // Step 2: Lấy thông tin user từ database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('auth_user_id', authData.user.id)
      .single();

    if (userError) {
      console.error('User fetch error:', userError);
      throw userError;
    }

    // Step 3: Kiểm tra role (chỉ admin/supervisor)
    if (!['admin', 'supervisor'].includes(userData.role)) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin và supervisor được phép đăng nhập web'
      });
    }

    // Step 4: Kiểm tra active status
    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Step 5: Set refresh token in httpOnly cookie
    res.cookie('refresh_token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    });

    console.log('✅ Login successful for:', userData.email);

    // Step 6: Trả về access token và user info
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      session: {
        access_token: authData.session.access_token,
        expires_at: authData.session.expires_at
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        avatar: userData.avatar,
        company: userData.company
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    
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
 * REFRESH TOKEN - Làm mới access token
 */
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Không có refresh token'
      });
    }

    // Refresh session với Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.error('Refresh error:', error);
      throw error;
    }

    // Set new refresh token in cookie
    res.cookie('refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log('✅ Token refreshed for user:', data.user.id);

    res.json({
      success: true,
      access_token: data.session.access_token,
      expires_at: data.session.expires_at
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    
    // Clear invalid cookie
    res.clearCookie('refresh_token');
    
    res.status(401).json({
      success: false,
      message: 'Refresh token không hợp lệ hoặc đã hết hạn'
    });
  }
};

/**
 * GET ME - Lấy thông tin user hiện tại
 */
export const getMe = async (req, res) => {
  try {
    // req.user đã được set bởi authMiddleware
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy thông tin thất bại'
    });
  }
};

/**
 * LOGOUT - Đăng xuất
 */
export const logout = async (req, res) => {
  try {
    // Clear httpOnly cookie
    res.clearCookie('refresh_token', { path: '/' });

    // Revoke session với Supabase (optional)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await supabase.auth.admin.signOut(token);
    }

    console.log('✅ Logout successful');

    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    // Vẫn clear cookie dù có lỗi
    res.clearCookie('refresh_token', { path: '/' });
    res.status(500).json({
      success: false,
      message: 'Đăng xuất thất bại'
    });
  }
};

/**
 * FORGOT PASSWORD - Yêu cầu reset password
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
      message: 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Gửi email thất bại'
    });
  }
};

/**
 * RESET PASSWORD - Đặt lại mật khẩu
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

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Đổi mật khẩu thất bại'
    });
  }
};