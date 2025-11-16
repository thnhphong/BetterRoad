// client/src/lib/authUtils.js
import { supabase } from './supabase';

/**
 * Get current authenticated user with error handling
 * @returns {Promise<{user: object|null, userData: object|null, error: Error|null}>}
 */
export const getCurrentUser = async () => {
  try {
    // Get auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { user: null, userData: null, error: sessionError };
    }

    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, company_id, role, is_active')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return { user: session.user, userData: null, error: userError };
    }

    return { user: session.user, userData, error: null };
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, userData: null, error };
  }
};

/**
 * Get company ID for current user
 * @returns {Promise<number|null>}
 */
export const getCurrentCompanyId = async () => {
  const { userData } = await getCurrentUser();

  if (userData?.company_id) {
    return userData.company_id;
  }

  // Try to find company by email
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (companyData) {
      // Update user with company_id
      await supabase
        .from('users')
        .update({ company_id: companyData.id })
        .eq('email', session.user.email);

      return companyData.id;
    }
  } catch (error) {
    console.error('Error getting company ID:', error);
  }

  return null;
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Logout user
 * @returns {Promise<{error: Error|null}>}
 */
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Logout error:', error);
    return { error };
  }
};