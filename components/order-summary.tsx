import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LocalizedText } from "@/components/ui/localized-text";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  className?: string;
}

export function OrderSummary({
  subtotal,
  shipping,
  tax,
  total,
  className,
}: OrderSummaryProps) {
  return (
    <Card className={cn("h-fit shadow-lg border-border/60", className)}>
      <CardHeader>
        <CardTitle>
          <LocalizedText hu="Rendelési összegzés" en="Order Summary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              <LocalizedText hu="Részösszeg" en="Subtotal" />
            </span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              <LocalizedText hu="Szállítás" en="Shipping" />
            </span>
            <span>
              {shipping === 0 ? (
                <LocalizedText hu="Ingyenes" en="Free" />
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              <LocalizedText hu="Adó" en="Tax" />
            </span>
            <span>${tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>
            <LocalizedText hu="Végösszeg" en="Total" />
          </span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
