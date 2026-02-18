import { Card, CardContent } from '../ui/card';
import { Calendar } from 'lucide-react';

export const Event = ({event}) => {
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