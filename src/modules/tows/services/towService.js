import { apiService } from '@/services/apiService';

export const towService = {
  getTows: async (params) => {
    return await apiService.getRecords('tows', params);
  },
  
  getTow: async (id) => {
    return await apiService.getRecord('tows', id);
  },
  
  createTow: async (data) => {
    return await apiService.createRecord('tows', data);
  },
  
  updateTow: async (id, data) => {
    return await apiService.updateRecord('tows', id, data);
  },
  
  deleteTow: async (id) => {
    return await apiService.deleteRecord('tows', id);
  }
};
