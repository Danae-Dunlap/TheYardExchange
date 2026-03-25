import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const REPORT_REASONS = [
  "Fake/Fraudulent Business",
  "Inappropriate Content",
  "Misleading Information",
  "Harassment",
  "Scam",
  "Other",
];

interface ReportBusinessFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  userId: string;
}

export function ReportBusinessForm({
  open,
  onOpenChange,
  businessId,
  userId,
}: ReportBusinessFormProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "Please select a reason", description: "A reason is required to submit a report." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("business_reports").insert({
        reporter_id: userId,
        business_id: businessId,
        reason,
        details: details || null,
      });

      if (error) throw error;

      toast({ title: "Report submitted", description: "Thank you. We'll review this business." });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDetails("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Business</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Reason *</span>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Additional details (optional)</span>
            <Textarea
              placeholder="Provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <span className="text-xs text-muted-foreground text-right">{details.length}/500</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading || !reason}>
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
