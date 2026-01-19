import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface PlaceholderDemoProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

export function PlaceholderDemo({ title, description, icon, features }: PlaceholderDemoProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 gap-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <Button className="w-full" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Coming Soon
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Features</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              {features.map((feature, idx) => (
                <p key={idx}>• {feature}</p>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
