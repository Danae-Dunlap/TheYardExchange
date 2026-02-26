import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Category, Business, Location, BusinessHours } from "@/lib/interfaces";
import { fetchBusiness } from "@/lib/data/utils";
import { useBusinessForm } from "@/hooks/useBusinessForm";
import BusinessForm from "@/components/business/BusinessForm";

const EditBusiness = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: Category.Default,
    description: "",
    hours_of_operation: {
      sunday: { open: "", close: "", is_open: true },
      monday: { open: "", close: "", is_open: true },
      tuesday: { open: "", close: "", is_open: true },
      wednesday: { open: "", close: "", is_open: true },
      thursday: { open: "", close: "", is_open: true },
      friday: { open: "", close: "", is_open: true },
      saturday: { open: "", close: "", is_open: true },
    } as BusinessHours,
    location: Location.Other,
    logo_url: null as File | null,
    email: "",
    phone_number: "",
    instagram: "",
    tiktok: "",
    website: "",
    facebook: "",
    tags: "",
  });

  const { toast } = useToast();

  const { loading, handleSubmit } = useBusinessForm({
    isCreate: false,
    userId: user?.id || "",
    existingBusiness: business,
    onSuccess: () => navigate("/dashboard"),
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
      return;
    }

    if (user) {
      loadBusinessData();
    }
  }, [user, authLoading, navigate]);

  const loadBusinessData = async () => {
    if (!user) return;

    setLoadingBusiness(true);
    try {
      const businessData = await fetchBusiness({ owner_id: user.id });
      if (businessData && businessData.length > 0) {
        const loadedBusiness = businessData[0];
        setBusiness(loadedBusiness);
        setFormData({
          name: loadedBusiness.name,
          category: loadedBusiness.category,
          location: loadedBusiness.location,
          description: loadedBusiness.description || "",
          hours_of_operation: loadedBusiness.hours_of_operation,
          logo_url: null,
          email: loadedBusiness.contact_info?.email || "",
          phone_number: loadedBusiness.contact_info?.phone_number || "",
          instagram: loadedBusiness.contact_info?.instagram || "",
          tiktok: loadedBusiness.contact_info?.tiktok || "",
          website: loadedBusiness.contact_info?.website || "",
          facebook: loadedBusiness.contact_info?.facebook || "",
          tags: loadedBusiness.tags?.join(", ") || "",
        });
      } else {
        toast({
          title: "Error",
          description: "Business not found",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load business",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setLoadingBusiness(false);
    }
  };

  const handleFormSubmit = async (data: typeof formData) => {
    setFormData(data);
    try {
      await handleSubmit(data);
    } catch {
      // Error handling is done in the hook
    }
  };

  if (authLoading || loadingBusiness) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <BusinessForm
      businessFormData={formData}
      is_create={false}
      callback={handleFormSubmit}
      loading={loading}
    />
  );
};

export default EditBusiness;