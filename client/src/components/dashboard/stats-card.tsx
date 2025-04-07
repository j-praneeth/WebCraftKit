import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: "increase" | "decrease" | "neutral";
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  iconBgColor,
  iconColor,
}: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <i className={cn(icon, "text-xl", iconColor)}></i>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd>
                <div className="flex items-center">
                  <div className="text-2xl font-semibold text-gray-900">
                    {value}
                  </div>
                  {change && (
                    <div className={cn(
                      "ml-2 flex items-baseline text-sm font-semibold",
                      changeType === "increase" ? "text-green-600" : 
                      changeType === "decrease" ? "text-red-600" : 
                      "text-gray-600"
                    )}>
                      <i className={cn(
                        changeType === "increase" ? "ri-arrow-up-s-fill" : 
                        changeType === "decrease" ? "ri-arrow-down-s-fill" : 
                        "ri-arrow-right-s-fill"
                      )}></i>
                      <span className="sr-only">
                        {changeType === "increase" ? "Increased by" : 
                         changeType === "decrease" ? "Decreased by" : 
                         "Changed by"}
                      </span>
                      {change}
                    </div>
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
