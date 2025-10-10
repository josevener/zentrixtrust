import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center border-emerald-100 shadow-sm hover:shadow-lg transition-all duration-200">
      <CardHeader className="flex flex-col items-center gap-3">
        {icon}
        <CardTitle className="text-xl font-semibold text-emerald-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}