import  supabase  from '../config/supabase.js';

/**
 * Middleware xác thực token
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token với Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Token verification failed:', authError);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Lấy thông tin user từ database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy thông tin user'
      });
    }

    // Check active status
    if (!userData.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Attach user info to request
    req.user = userData;
    req.authUser = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Xác thực thất bại'
    });
  }
};

/**
 * Middleware kiểm tra role
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Chỉ ${allowedRoles.join(', ')} mới có quyền truy cập`
      });
    }

    next();
  };
};

/**
 * Middleware kiểm tra company
 */
export const requireSameCompany = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Chưa xác thực'
    });
  }

  const targetCompanyId = req.params.companyId || req.body.companyId;
  
  if (targetCompanyId && targetCompanyId !== req.user.company_id) {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập dữ liệu công ty khác'
    });
  }

  next();
};
export default authMiddleware;
