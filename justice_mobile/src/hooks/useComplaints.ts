import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

// ✅ Correction : Ajout du paramètre 'mode' pour gérer les rôles
export const useComplaints = (mode: 'all' | 'mine' = 'mine') => {
  return useQuery({
    // On ajoute le mode dans la queryKey pour que le cache soit distinct 
    // entre "mes plaintes" et "toutes les plaintes"
    queryKey: ["complaints", mode], 
    queryFn: async () => {
      // ✅ Si mode === 'mine', on utilise la route qui posait le 403 pour l'officier
      // Si mode === 'all', on utilise la route générale /complaints
      const endpoint = mode === 'mine' ? "/complaints/my-complaints" : "/complaints";
      const response = await api.get(endpoint);
      return response.data;
    },
  });
};

export const usetransitionComplaint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string, status: string, note?: string }) => {
      return api.patch(`/complaints/${id}/status`, { status, note });
    },
    onSuccess: () => {
      // On invalide toutes les requêtes qui commencent par "complaints" pour rafraîchir les listes
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
};
