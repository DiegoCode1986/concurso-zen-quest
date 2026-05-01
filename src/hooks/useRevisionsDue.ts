import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RevisionDueInfo {
  todayCount: number;
  overdueCount: number;
  total: number;
}

const todayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

export const useRevisionsDue = (refreshKey: number = 0) => {
  const [info, setInfo] = useState<RevisionDueInfo>({ todayCount: 0, overdueCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInfo({ todayCount: 0, overdueCount: 0, total: 0 });
        return;
      }

      const { data, error } = await supabase
        .from('revisions')
        .select('review_1_date, review_2_date, review_3_date, review_4_date, review_1_done, review_2_done, review_3_done, review_4_done')
        .eq('user_id', user.id);

      if (error) throw error;

      const today = todayISO();
      let todayCount = 0;
      let overdueCount = 0;

      (data || []).forEach((row: any) => {
        for (let i = 1; i <= 4; i++) {
          const date = row[`review_${i}_date`];
          const done = row[`review_${i}_done`];
          if (done) continue;
          if (date === today) todayCount++;
          else if (date < today) overdueCount++;
        }
      });

      setInfo({ todayCount, overdueCount, total: todayCount + overdueCount });
    } catch (e) {
      console.error('Error fetching revisions due:', e);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...info, loading, refetch: fetchData };
};
