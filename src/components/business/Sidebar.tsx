import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import ContactInfo from "./ContactInfo";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { MapPin, Flag } from "lucide-react";
import { ReportBusinessForm } from "./ReportBusinessForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Sidebar = ({business}) => {
    const [reportOpen, setReportOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleReportClick = () => {
        if (!user) {
            toast({ title: "Sign in required", description: "You must be signed in to report a business." });
            return;
        }
        setReportOpen(true);
    };

    return(
        <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Business</h3>
                <ContactInfo contacts={business.contact_info} />
                <Separator className="my-4" />

                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={handleReportClick}
                  >
                    <Flag className="h-4 w-4" />
                    Report Business
                  </Button>
                </div>
              </CardContent>
            </Card>

            {user && (
                <ReportBusinessForm
                    open={reportOpen}
                    onOpenChange={setReportOpen}
                    businessId={business.id}
                    userId={user.id}
                />
            )}
          </div>
    );
}

export default Sidebar;
