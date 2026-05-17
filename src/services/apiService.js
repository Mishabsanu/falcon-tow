/**
 * Core API Service for handling all backend communication.
 * Standardizes fetch calls, error handling, and query parameter construction.
 */

const API_BASE = '/api';

export const apiService = {
  /**
   * Fetches a paginated and filtered list of records for a given module.
   */
  /**
   * Fetches a paginated and filtered list of records for a given module.
   * Automatically applies role-based filtering for Workers.
   */
  async getRecords(moduleKey, options = {}) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    const isWorker = user?.role === 'Worker';
    
    const extraParams = { ...options.extraParams };
    if (isWorker) {
      // Role-based filtering: Workers only see their OWN data (linked via native _id)
      if (moduleKey === 'tows') extraParams.driverId = user._id;
      if (['expenses', 'salaries'].includes(moduleKey)) extraParams.workerId = user._id;
    }

    const params = new URLSearchParams({
      q: options.q || '',
      page: options.page || 1,
      limit: options.limit || 10,
      status: options.status || 'All',
      ...extraParams
    });

    const response = await fetch(`${API_BASE}/${moduleKey}?${params.toString()}`);
    if (!response.ok) throw new Error(`Failed to fetch ${moduleKey}`);
    return await response.json();
  },

  /**
   * Fetches all records for a module without pagination (useful for reports).
   * Automatically applies role-based filtering for Workers.
   */
  async getAllRecords(moduleKey) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    const isWorker = user?.role === 'Worker';
    
    let url = `${API_BASE}/${moduleKey}?limit=1000`;
    if (isWorker) {
      if (moduleKey === 'tows') url += `&driverId=${user._id}`;
      if (['expenses', 'salaries'].includes(moduleKey)) url += `&workerId=${user._id}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch all ${moduleKey}`);
    const result = await response.json();
    return result.data || [];
  },

  /**
   * Fetches a single record by its ID.
   */
  async getRecord(moduleKey, id) {
    const response = await fetch(`${API_BASE}/${moduleKey}/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch ${moduleKey} with ID: ${id}`);
    const result = await response.json();
    return result.data;
  },

  /**
   * Creates a new record in the specified module.
   */
  async createRecord(moduleKey, data) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    const isWorker = user?.role === 'Worker';

    // Auto-assign worker ID if creating tows or expenses as a worker
    const payload = { ...data };
    if (isWorker) {
       if (moduleKey === 'tows') {
          payload.driver = user.name;
          payload.driverId = user.id;
       }
       if (moduleKey === 'expenses') {
          payload.worker = user.name;
          payload.workerId = user.id;
          payload.expenseType = 'Operational';
       }
    }

    // Administrative tracking
    payload.createdBy = user?.name || "System";
    payload.createdById = user?._id || user?.id;

    const response = await fetch(`${API_BASE}/${moduleKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to create ${moduleKey} record`);
    }
    const result = await response.json();
    return result.data;
  },

  /**
   * Updates an existing record.
   */
  async updateRecord(moduleKey, id, data) {
    const response = await fetch(`${API_BASE}/${moduleKey}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to update ${moduleKey} record`);
    }
    const result = await response.json();
    return result.data;
  },

  /**
   * Deletes a record by its ID.
   * Restricts Workers from deleting any record.
   */
  async deleteRecord(moduleKey, id) {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    if (user?.role === 'Worker') {
       throw new Error('Action Denied: Workers do not have deletion privileges.');
    }

    const response = await fetch(`${API_BASE}/${moduleKey}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to delete ${moduleKey} record`);
    }
    const result = await response.json();
    return result.success;
  },

  /**
   * Dashboard specific stats fetcher.
   */
  /**
   * Dashboard specific stats fetcher.
   * Automatically applies role-based filtering for Workers.
   */
  async getDashboardStats() {
    const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
    const isWorker = user?.role === 'Worker';
    
    let url = `${API_BASE}/dashboard/stats`;
    if (isWorker) {
      url += `?workerId=${user._id}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch dashboard statistics');
    return await response.json();
  },

  async getNextId(moduleKey) {
    const response = await fetch(`/api/system/id?module=${moduleKey}`);
    if (!response.ok) throw new Error('Failed to fetch next ID');
    return await response.json();
  },

  /**
   * Bulk imports records into the specified module.
   */
  async importRecords(moduleKey, data) {
    const response = await fetch(`${API_BASE}/${moduleKey}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to import ${moduleKey} records`);
    }
    return await response.json();
  }
};
