import { Card, CardContent } from "@/shared/ui/card";

// Temporary placeholder until each feature page is built.
export function ComingSoon({ feature }: { feature: string }) {
  return (
    <Card>
      <CardContent className="text-muted-foreground py-16 text-center text-sm">
        {feature} is coming next.
      </CardContent>
    </Card>
  );
}
