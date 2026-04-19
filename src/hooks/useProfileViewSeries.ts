import { useEffect, useLayoutEffect, useState } from "react";
import { fetchProfileViewSeries, toUserFacingError, type ProfileViewPoint, type ProfileViewRange } from "@/lib/data/utils";

type UseProfileViewSeriesParams = {
  businessId?: string;
  viewRange: ProfileViewRange;
};

export const useProfileViewSeries = ({ businessId, viewRange }: UseProfileViewSeriesParams) => {
  const [viewSeries, setViewSeries] = useState<ProfileViewPoint[]>([]);
  const [viewSeriesLoading, setViewSeriesLoading] = useState(false);
  const [viewSeriesError, setViewSeriesError] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (!businessId) {
      return;
    }
    setViewSeriesLoading(true);
  }, [businessId, viewRange]);

  useEffect(() => {
    if (!businessId) {
      setViewSeries([]);
      setViewSeriesError(null);
      setViewSeriesLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await fetchProfileViewSeries(businessId, viewRange);
        if (cancelled) {
          return;
        }

        if (result.ok) {
          setViewSeries(result.data);
          setViewSeriesError(null);
        } else {
          setViewSeries([]);
          setViewSeriesError(result.error);
        }
      } catch (error) {
        console.error("Error loading view series:", error);
        if (!cancelled) {
          setViewSeries([]);
          setViewSeriesError(toUserFacingError(error));
        }
      } finally {
        if (!cancelled) {
          setViewSeriesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, viewRange]);

  return {
    viewSeries,
    viewSeriesLoading,
    viewSeriesError,
  };
};
