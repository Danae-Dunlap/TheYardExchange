
export const Product = ({service}) => {
    return (
                <div key={service.id} className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <p className="font-semibold text-foreground">{service.price}</p>
                    {service.duration && <p className="text-sm text-muted-foreground">{service.duration}</p>}
                </div>
    );
}