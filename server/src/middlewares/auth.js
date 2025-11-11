import supabase from '../config/supabase.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify với Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) throw error;

    // Lấy user data từ database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (userError) throw userError;

    // Attach user to request
    req.user = userData;
    req.authUser = user;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.message?.includes('JWT expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
};

export default authMiddleware;
