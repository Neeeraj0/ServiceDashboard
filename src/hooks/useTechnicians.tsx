import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Technician } from '@/types/Technician';

const TECHNICIANS_QUERY_KEY = ['technicians'];

export function useTechnicians() {
  const queryClient = useQueryClient();

  const { data: technicians = [], isLoading, error } = useQuery({
    queryKey: TECHNICIANS_QUERY_KEY,
    queryFn: async () => {
      const response = await axios.get('http://35.154.208.29:8080/api/technicians/getTechnicians');
      return response.data;
    },
  });

  const refreshTechnicians = async () => {
    await queryClient.invalidateQueries({ queryKey: TECHNICIANS_QUERY_KEY });
  };

  return {
    technicians,
    isLoading,
    error,
    refreshTechnicians,
  };
}