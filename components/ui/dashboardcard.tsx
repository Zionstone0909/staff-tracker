// file: app/components/ui/DashboardNavCard.tsx
import Link from "next/link";

interface DashboardNavCardProps {
  name: string;
  href: string;
  description?: string;
}

export default function DashboardNavCard({ name, href, description }: DashboardNavCardProps) {
  return (
    <Link
      href={href}
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white flex flex-col justify-between"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <div className="mt-4 text-blue-500 font-medium text-sm">Go →</div>
    </Link>
  );
}
