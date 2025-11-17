// ============================================
// server/src/controllers/damage.controller.js
// ============================================
import { supabase } from '../config/supabase.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createDamage = async (req, res) => {
  try {
    const {
      title,
      description,
      severity,
      status = 'pending',
      location,
      road_id,
      images = [],
      ai_analysis
    } = req.body;
    const companyId = req.user.companyId; // From authenticated company user

    // Validate required fields
    if (!title || !location) {
      return errorResponse(res, 'Title and location are required', 400);
    }

    if (!severity || (severity < 1 || severity > 5)) {
      return errorResponse(res, 'Severity must be between 1 and 5', 400);
    }

    // Validate location format
    if (!location.lat || !location.lng) {
      return errorResponse(res, 'Location must contain lat and lng', 400);
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // If road_id is provided, verify it belongs to the company
    if (road_id) {
      const { data: road, error: roadError } = await supabase
        .from('roads')
        .select('id, company_id')
        .eq('id', road_id)
        .single();

      if (roadError || !road) {
        return errorResponse(res, 'Road not found', 404);
      }

      if (road.company_id !== companyId) {
        return errorResponse(res, 'Unauthorized: Road does not belong to your company', 403);
      }
    }

    // Create damage record
    const { data: damage, error: damageError } = await supabase
      .from('damages')
      .insert({
        company_id: companyId,
        road_id: road_id || null,
        reported_by: null, // Can be set later if needed
        title: title,
        description: description || null,
        severity: severity,
        status: status,
        location: location, // JSONB: {lat, lng, address}
        images: images.length > 0 ? images : null,
        ai_analysis: ai_analysis || null,
      })
      .select()
      .single();

    if (damageError) {
      console.error('Create damage error:', damageError);
      console.error('Create damage error details:', JSON.stringify(damageError, null, 2));
      return errorResponse(
        res,
        damageError.message || 'Failed to create damage',
        400,
        damageError
      );
    }

    return successResponse(
      res,
      {
        id: damage.id,
        title: damage.title,
        description: damage.description,
        severity: damage.severity,
        status: damage.status,
        location: damage.location,
        images: damage.images,
        road_id: damage.road_id,
        company_id: damage.company_id,
        created_at: damage.created_at,
      },
      'Damage created successfully',
      201
    );
  } catch (error) {
    console.error('Create damage error:', error);
    return errorResponse(res, 'Failed to create damage', 500);
  }
};

export const getDamages = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { data: damages, error } = await supabase
      .from('damages')
      .select(`
        *,
        road:roads(id, name, code)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get damages error:', error);
      return errorResponse(res, 'Failed to fetch damages', 500);
    }

    return successResponse(res, damages || [], 'Damages retrieved successfully');
  } catch (error) {
    console.error('Get damages error:', error);
    return errorResponse(res, 'Failed to fetch damages', 500);
  }
};

export const getRoads = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { data: roads, error } = await supabase
      .from('roads')
      .select('id, name, code')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Get roads error:', error);
      return errorResponse(res, 'Failed to fetch roads', 500);
    }

    return successResponse(res, roads || [], 'Roads retrieved successfully');
  } catch (error) {
    console.error('Get roads error:', error);
    return errorResponse(res, 'Failed to fetch roads', 500);
  }
};

