// ============================================
// server/src/middleware/auth.js
// ============================================
import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import { supabase } from '../config/supabase.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 'No token provided', 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }

    // Get company info
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('auth_user_id', decoded.userId)
      .single();

    if (error || !company) {
      return errorResponse(res, 'Company not found', 404);
    }

    if (!company.is_active) {
      return errorResponse(res, 'Company account is inactive', 403);
    }

    req.user = {
      userId: decoded.userId,
      companyId: company.id,
      email: company.email,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 'Authentication failed', 401);
  }
};