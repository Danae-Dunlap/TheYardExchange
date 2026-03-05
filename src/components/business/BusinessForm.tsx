import { z } from "zod";
import { Category, Location } from '@/lib/interfaces';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import HoursOfOperations from "@/components/business/Hours";
import Header from "@/components/layout/Header";
import { ArrowLeft, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState, FormEvent } from "react";

// Helper schema for a single day's hours. either closed or both times provided
const dayHoursSchema = z.union([
    z.object({ is_open: z.literal(false) }),
    z.object({
        is_open: z.literal(true),
        open: z.string().min(1, "Open time is required when day is open"),
        close: z.string().min(1, "Close time is required when day is open"),
    }),
]);

export const businessSchema = z.object({
    name: z.string().trim().min(1, "Business name is required").max(100, "Name must be less than 100 characters"),
    category: z.nativeEnum(Category).refine(val => val !== Category.Default, "Please select a category"),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
    hours_of_operation: z.object({
        sunday: dayHoursSchema,
        monday: dayHoursSchema,
        tuesday: dayHoursSchema,
        wednesday: dayHoursSchema,
        thursday: dayHoursSchema,
        friday: dayHoursSchema,
        saturday: dayHoursSchema,
    }),
    logo_url: z.instanceof(File).optional().refine(file => {
        if (!file) return true;
        const validTypes = ["image/png", "image/jpeg", "image/jpg"];
        return validTypes.includes(file.type);
    }, "Invalid file type. Must be PNG or JPEG.").optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    location: z.nativeEnum(Location),
    phone_number: z.string().optional().or(z.literal("")),
    instagram: z.string().optional().or(z.literal("")),
    tiktok: z.string().optional().or(z.literal("")),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    facebook: z.string().optional().or(z.literal("")),
    tags: z.string().optional(),
});

type businessData = {
    name: string;
    category: Category;
    description: string;
    hours_of_operation: {
        sunday: { open: string; close: string; is_open: boolean };

        monday: { open: string; close: string; is_open: boolean },
        tuesday: { open: string; close: string; is_open: boolean },
        wednesday: { open: string; close: string; is_open: boolean },
        thursday: { open: string; close: string; is_open: boolean },
        friday: { open: string; close: string; is_open: boolean },
        saturday: { open: string; close: string; is_open: boolean }
    },
    logo_url: File | null,
    location: Location,
    email: string,
    phone_number: string,
    instagram: string,
    tiktok: string,
    website: string,
    facebook: string,
    tags: string,
};

const BusinessForm = ({
    businessFormData,
    is_create,
    callback,
    loading = false,
}: {
    businessFormData: businessData;
    is_create: boolean;
    callback: (data: typeof businessFormData) => void;
    loading?: boolean;
}) => {
    const [formData, setFormData] = useState(businessFormData);
    const navigate = useNavigate();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        callback(formData);
    };

    const handleHours = (hours) => {
        setFormData(prev => ({ ...prev, hours_of_operation: hours }));
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="container mx-auto px-4 py-8 max-w-3xl">
            {is_create ? (
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
                ): (
                    <div className="container mx-auto px-4 py-8 max-w-3xl">
                        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                    )
            }
                        <Card className="shadow-lg border">
                            <CardHeader className="bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <Store className="h-6 w-6 text-primary" />
                                    <div>
                                        <CardTitle>{is_create ? "Create Business" : "Edit Business"}</CardTitle>
                                        <CardDescription>
                                            {is_create
                                                ? "Fill out the details to list your business"
                                                : "Update your business information"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Basic Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-foreground border-b py-1">Basic Information</h3>

                                        <div className="space-y-2">
                                            <Label htmlFor="name">Business Name *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., Sarah's Hair Studio"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category *</Label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(value) => setFormData({ ...formData, category: value as Category })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(Category)
                                                        .filter(cat => cat !== Category.Default)
                                                        .map((category) => (
                                                            <SelectItem key={category} value={category}>
                                                                {category}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description *</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Tell customers about your business..."
                                                rows={4}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="hours_of_operation">Hours of Operation *</Label>
                                            <HoursOfOperations
                                                callback={handleHours}
                                                hours={formData.hours_of_operation}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="tags">Tags</Label>
                                            <Input
                                                id="tags"
                                                value={formData.tags}
                                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                placeholder="e.g., braids, natural hair, quick service"
                                            />
                                            <p className="text-sm text-muted-foreground">Separate tags with commas</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="logo_url">Business Logo</Label>
                                            <Input
                                                id="logo_url"
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg"
                                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.files?.[0] || null })}
                                            />
                                            <p className="text-sm text-muted-foreground">Leave empty to keep current logo</p>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-foreground border-b pb-1">Contact Information</h3>
                                        <p className="text-sm text-muted-foreground">Update your contact details</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="business@example.com"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location *</Label>
                                                <Select
                                                    value={formData.location}
                                                    onValueChange={(value) => setFormData({ ...formData, location: value as Location })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a location" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.values(Location)
                                                            .map((location) => (
                                                                <SelectItem key={location} value={location}>
                                                                    {location}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="phone_number">Phone Number</Label>
                                                <Input
                                                    id="phone_number"
                                                    type="tel"
                                                    value={formData.phone_number}
                                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                    placeholder="(202) 555-0123"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="instagram">Instagram</Label>
                                                <Input
                                                    id="instagram"
                                                    value={formData.instagram}
                                                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                                    placeholder="@yourhandle"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="tiktok">TikTok</Label>
                                                <Input
                                                    id="tiktok"
                                                    value={formData.tiktok}
                                                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                                    placeholder="@yourhandle"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="website">Website</Label>
                                                <Input
                                                    id="website"
                                                    type="url"
                                                    value={formData.website}
                                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                    placeholder="https://yourwebsite.com"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="facebook">Facebook</Label>
                                                <Input
                                                    id="facebook"
                                                    value={formData.facebook}
                                                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                                    placeholder="Your Facebook Page"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button type="submit" disabled={loading} className="flex-1">
                                            {loading
                                                ? is_create
                                                    ? "Processing..."
                                                    : "Updating..."
                                                : is_create
                                                ? "Create Business"
                                                : "Update Business"}
                                        </Button>
                                        <Button type="button" variant="outline" 
                                        onClick={() => navigate("/dashboard")}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                        </div>
                    </div>
            );

}; 

export default BusinessForm; 