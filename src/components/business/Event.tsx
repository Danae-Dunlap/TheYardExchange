import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { BusinessEvent } from "@/lib/interfaces";
import { insertEvent, updateEvent } from "@/lib/data/utils";
import { Card, CardContent } from '../ui/card';
import { Calendar } from 'lucide-react';

const eventSchema = z.object({
  title: z.string().trim().min(1, "Event title is required").max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  start_date: z.string().min(1, "Start date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_date: z.string().min(1, "End date is required"),
  end_time: z.string().min(1, "End time is required"),
});

interface AddEventProps {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface EditEventProps {
  event: BusinessEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddEvent = ({ businessId, businessName, open, onOpenChange, onSuccess }: AddEventProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = eventSchema.parse(formData);

      setLoading(true);

      // Combine date and time into Date objects
      const startDateTime = new Date(`${validated.start_date}T${validated.start_time}`);
      const endDateTime = new Date(`${validated.end_date}T${validated.end_time}`);

      if (endDateTime <= startDateTime) {
        throw new Error("End date/time must be after start date/time");
      }

      const eventId = crypto.randomUUID();

      const event: BusinessEvent = {
        id: eventId,
        business_id: businessId,
        business_name: businessName,
        title: validated.title,
        description: validated.description || null,
        start_date: startDateTime,
        end_date: endDateTime,
      };

      await insertEvent(event);

      toast({
        title: "Event created!",
        description: "Your event has been added to your business.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to create event",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
            Add a new event to promote your business
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Spring Hair Care Workshop"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event..."
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
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
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

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const EditEvent = ({ event, open, onOpenChange, onSuccess }: EditEventProps) => {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    start_date: startDate.toISOString().split("T")[0],
    start_time: startDate.toTimeString().slice(0, 5),
    end_date: endDate.toISOString().split("T")[0],
    end_time: endDate.toTimeString().slice(0, 5),
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = eventSchema.parse(formData);

      setLoading(true);

      const startDateTime = new Date(`${validated.start_date}T${validated.start_time}`);
      const endDateTime = new Date(`${validated.end_date}T${validated.end_time}`);

      if (endDateTime <= startDateTime) {
        throw new Error("End date/time must be after start date/time");
      }

      const updatedEvent: BusinessEvent = {
        id: event.id,
        business_id: event.business_id,
        business_name: event.business_name,
        title: validated.title,
        description: validated.description || null,
        start_date: startDateTime,
        end_date: endDateTime,
      };

      await updateEvent(updatedEvent);

      toast({
        title: "Event updated!",
        description: "Your event has been successfully updated.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update event",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update your event details
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Event Title *</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Spring Hair Care Workshop"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-start_date">Start Date *</Label>
              <Input
                id="edit-start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-start_time">Start Time *</Label>
              <Input
                id="edit-start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end_date">End Date *</Label>
              <Input
                id="edit-end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-end_time">End Time *</Label>
              <Input
                id="edit-end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const Event = ({event}) => {
    return (
        <Card key={event.id}>
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-1">{event.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{String(event.start_date)} - {String(event.end_date)}</p>
                        <p className="text-sm text-foreground">{event.description}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export {AddEvent, EditEvent, Event};