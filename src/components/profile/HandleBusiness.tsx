import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { useNavigate } from "react-router";
import {Card, CardContent} from "../ui/card"
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Store } from "lucide-react";

const HandleBusinessOwner = () => {
    const { user, isBusinessOwner } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleBecomeBusinessOwner = async () => {
        if (!user) return;
    
        setLoading(true);
        // Check if user already has a business
        const { data: business } = await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();
    
        if (business) {
          toast({ title: "You're now a business owner!" });
          
          navigate("/dashboard");
        } else {
          toast({ title: "Let's set up your business!" });
          navigate("/create-business");
        }
    
        setLoading(false);
      };

    return(
    <div>
        {!isBusinessOwner ? (
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Store className="h-8 w-8 text-primary mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Want to list your business?</h3>
                  <p className="text-muted-foreground mb-4">
                    Become a business owner to showcase your services to the Howard community.
                  </p>
                  <Button onClick={handleBecomeBusinessOwner} disabled={loading}>
                    {loading ? "Processing..." : "List My Business"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ): (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Business Owner</h3>
                  <p className="text-sm text-muted-foreground">Manage your business listing</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/create-business">Create Business</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )} 
    </div>
    );
}

export default HandleBusinessOwner;