import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Category, Location, BusinessHours } from "@/lib/interfaces";
import { useBusinessForm } from "@/hooks/useBusinessForm";
import BusinessForm from "@/components/business/BusinessForm"; 

const CreateBusiness = () => {
  const { user, loading: authLoading, refreshRoles} = useAuth();
  const navigate = useNavigate();
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
    },
    logo_url: null as File | null,
    location: Location.Other,
    email: "",
    phone_number: "",
    instagram: "",
    tiktok: "",
    website: "",
    facebook: "",
    tags: "",
  });

  const { loading, handleSubmit } = useBusinessForm({
    isCreate: true,
    userId: user?.id || "",
    onSuccess: async () => {await refreshRoles(); navigate("/dashboard");},
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleFormSubmit = async (data: typeof formData) => {
    setFormData(data);
    try {
      await handleSubmit(data);
    } catch {
      // Error handling is done in the hook
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <BusinessForm
      businessFormData={formData}
      is_create={true}
      callback={handleFormSubmit}
      loading={loading}
    />
  );
};

export default CreateBusiness;
