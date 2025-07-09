import { Button } from "~/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/core/components/ui/card";

export default function SentryDebug() {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sentry Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              throw new Error("Sentry Frontend Error");
            }}
          >
            Throw error
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 