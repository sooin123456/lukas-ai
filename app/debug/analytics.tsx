import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";

export default function AnalyticsDebug() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Analytics Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              console.log("Analytics event triggered");
            }}
          >
            Track event
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 