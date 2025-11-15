const getInputValue = (e: React.ChangeEvent<HTMLInputElement>) => getInputValue(e)
// components/ui/chart.tsx
import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

// Your original data type
interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// Type Recharts Pie requires
interface ChartDataInput {
  [key: string]: string | number;
}

// Props for your chart component
interface PieChartProps {
  data: ChartData[];
  width?: number;
  height?: number;
}

// Custom Tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[]; // optional, but Recharts passes an array
  label?: string;
}

// Custom Tooltip component
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#fff", border: "1px solid #ccc", padding: "5px" }}>
        <p>{payload[0].name}</p>
        <p>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const PieChartComponent: React.FC<PieChartProps> = ({ data, width = 300, height = 300 }) => {
  // Map your data to Recharts-friendly format
  const formattedData: ChartDataInput[] = data.map(d => ({
    name: d.name,
    value: d.value,
    color: d.color ?? "#8884d8",
  }));

  return (
    <PieChart width={width} height={height}>
      <Pie
        data={formattedData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        fill="#8884d8"
      >
        {formattedData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color as string} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  );
};

export default PieChartComponent;


