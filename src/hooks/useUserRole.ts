import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'editor' | 'viewer' | null;

export function useUserRole() {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      setRole((data?.role as AppRole) || null);
      setLoading(false);
    };

    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = role === 'admin';
  const isEditor = role === 'editor';
  const isViewer = role === 'viewer';
  const canEdit = isAdmin || isEditor;
  const canDelete = isAdmin;

  return { role, loading, isAdmin, isEditor, isViewer, canEdit, canDelete };
}
