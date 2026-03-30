import { BusinessPromotion } from "@/lib/interfaces"
import { Badge } from "../ui/badge";
import { BadgePercent, Ellipsis, X } from "lucide-react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import z from 'zod';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const Promotion = ({ promotion, onUpdate }: { promotion: BusinessPromotion; onUpdate?: () => void }) => {
    const { profile } = useAuth();
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
     const { toast } = useToast();
    const isOwnPromotion = profile.business_id === promotion.business_id;

    const handleDelete = async () => {
        const { error } = await supabase.from('promotions').delete().eq('id', promotion.id)
        if (error) { console.error("Error deleting promotion:", error); }
        toast({
            title: "Promotion Deleted",
            description: "The promotion has been deleted successfully."
        }); 
        onUpdate();
    }

    return (
        <>
            <div className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BadgePercent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-foreground truncate">{promotion.title}</h4>
                                <Badge variant={
                                    new Date(promotion.end_date) < new Date() ? "secondary" : (new Date(promotion.start_date) > new Date() ? "secondary" : "default")
                                }>
                                    {new Date(promotion.end_date) < new Date() ? "Ended" : (new Date(promotion.start_date) > new Date() ? "Upcoming" : "Active")}
                                </Badge>
                            </div>
                            {promotion.description && (
                                <p className="text-sm text-muted-foreground mb-2 truncate">{promotion.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                {new Date(promotion.start_date).toLocaleDateString()} → {new Date(promotion.end_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {isOwnPromotion && (
                        <div className="flex gap-1 items-start">
                            <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
                                <Ellipsis className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {promotion.title}?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PromotionForm
                businessId={profile.business_id}
                promotion={promotion}
                isEdit={true}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={() => { setEditOpen(false); onUpdate(); }}
            />
        </>
    );
}

const promotionSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(100),
    description: z.string().trim().max(250),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
});

const PromotionForm = ({ businessId, promotion, isEdit, open, onOpenChange, onSuccess }: { businessId: string, promotion?: BusinessPromotion, isEdit?: boolean, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
        title: promotion?.title || "",
        description: promotion?.description || "",
        start_date: promotion?.start_date ? new Date(promotion.start_date).toISOString().split('T')[0] : "",
        end_date: promotion?.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : "",
         })
    const { toast } = useToast();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            const validated = promotionSchema.parse(formData);

            

            if (!isEdit) {
                const { error } = await supabase.from("promotions").insert({
                    business_id: businessId,
                    start_date: validated.start_date,
                    end_date: validated.end_date,
                    title: validated.title,
                    description: validated.description,
                });
                if (error) { console.log("Error inserting promotion:", error); }
            } else {
                const { error } = await supabase.from("promotions").update({
                    start_date: validated.start_date,
                    end_date: validated.end_date,
                    title: validated.title,
                    description: validated.description,
                }).eq("id", promotion?.id);
                if (error) { console.log("Error updating promotion:", error); }
            }

            toast({
                title: "Promotion Created",
                description: "Your promotion has been created successfully."
            });

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (error instanceof z.ZodError) {
                toast({
                    title: "Validation Error",
                    description: error.errors[0].message,
                    variant: "destructive"
                });
            }
            return;
        }

    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Promotion</DialogTitle>
                    <DialogDescription>
                        Add a new promotion to promote your business
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Promotion Title *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Buy One, Get One Free"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your promotion..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Start Date *</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                            />
                        </div>


                        <div className="space-y-2">
                            <Label htmlFor="end_date">End Date *</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isEdit ? ("Update Promotion") : ("Create Promotion")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};


export { Promotion, PromotionForm };