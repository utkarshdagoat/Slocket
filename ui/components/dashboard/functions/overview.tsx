import { useFunctionsStore } from "@/lib/stores/functions-store";
import { formatToUSD } from "@/lib/utils";
import { useState } from "react";

const Overview = () => {
  const { activeFunction } = useFunctionsStore();

  // TODO: Fetch metrics from server for 'activeFunction'
  const [uniqueTxn, setUniqueTxn] = useState(0);
  const [savings, setSavings] = useState(0);
  const [tx24h, setTx24h] = useState(0);

  const metrics = [
    {
      title: "Unique Txn till Date",
      value: uniqueTxn,
    },
    {
      title: "Transactions in last 24h",
      value: tx24h,
    },
    {
      title: "Savings",
      value: formatToUSD(savings),
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-background rounded-lg border p-4 flex flex-col justify-between"
        >
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground font-semibold mb-1">
              {metric.title}
            </p>
            <p className="text-4xl font-semibold">{metric.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Overview;
