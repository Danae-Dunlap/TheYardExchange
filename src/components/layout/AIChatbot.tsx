import { MessageCircle } from "lucide-react";
import { Button } from "../ui/button";

const AIChatbotIntro = () => {
    return(
      <section className="py-12 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto max-w-4xl text-center">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-3xl font-bold text-foreground mb-4">Need Help Finding Something?</h3>
          <p className="text-muted-foreground mb-6">
            Our AI assistant can help you discover the perfect business for your needs
          </p>
          <Button size="lg" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat with AI Assistant
          </Button>
        </div>
      </section>
    );

}

export default AIChatbotIntro; 