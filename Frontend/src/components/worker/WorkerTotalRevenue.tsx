// src/components/worker/WorkerTotalRevenue.tsx
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
dayjs.extend(isoWeek);

// ✅ Accept `dates` as prop to fix TypeScript error
interface WorkerTotalRevenueProps {
  dates: [Dayjs | null, Dayjs | null];
}

interface RevenueData {
  date: string;
  sales: number;
}

type FilterType = "daily" | "weekly" | "monthly" | "yearly";

const apiUrl = import.meta.env.VITE_API_URL;

const WorkerTotalRevenue: React.FC<WorkerTotalRevenueProps> = ({ dates }) => {
  const [rawData, setRawData] = useState<RevenueData[]>([]);
  const [data, setData] = useState<RevenueData[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("daily");

  const generateMonthDates = (start: Dayjs, end: Dayjs) => {
    const dates: string[] = [];
    for (let d = start; d.isSameOrBefore(end); d = d.add(1, "day")) {
      dates.push(d.format("YYYY-MM-DD"));
    }
    return dates;
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch(`${apiUrl}/get_payments`);

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const payments = await response.json();

        if (!Array.isArray(payments)) {
          console.error("Expected an array of payments:", payments);
          throw new Error("Invalid payments response from server");
        }

        const grouped: { [key: string]: number } = {};

        payments
          .filter((p: any) => p.payment_status === "paid")
          .forEach((p: any) => {
            const parsedDate = dayjs(p.payment_date);

            if (!parsedDate.isValid()) return;

            const date = parsedDate.format("YYYY-MM-DD");

            grouped[date] = (grouped[date] || 0) + Number(p.amount_paid || 0);
          });

        const allData: RevenueData[] = Object.keys(grouped)
          .sort((a, b) => dayjs(a).unix() - dayjs(b).unix())
          .map((date) => ({
            date,
            sales: grouped[date],
          }));

        setRawData(allData);

        const today = dayjs();
        const start = today.startOf("month");
        const end = today.endOf("month");

        const monthData = generateMonthDates(start, end).map((date) => {
          const item = allData.find((r) => r.date === date);

          return {
            date,
            sales: item ? item.sales : 0,
          };
        });

        setData(monthData);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchPayments();
  }, []);

  useEffect(() => {
    if (dates[0] && dates[1]) handleDateFilter(dates[0], dates[1]);
  }, [dates]);

  const groupData = (
    dataset: RevenueData[],
    type: "daily" | "monthly" | "yearly",
  ): RevenueData[] => {
    const sorted = [...dataset].sort((a, b) =>
      dayjs(a.date).diff(dayjs(b.date)),
    );

    if (type === "daily") return sorted;

    if (type === "monthly") {
      const grouped: { [key: string]: number } = {};
      sorted.forEach((item) => {
        const monthKey = dayjs(item.date).format("YYYY-MM");
        grouped[monthKey] = (grouped[monthKey] || 0) + item.sales;
      });

      const year = dayjs().year();
      const months: string[] = [];
      for (let m = 0; m < 12; m++) {
        const monthKey = dayjs(new Date(year, m, 1)).format("YYYY-MM");
        months.push(monthKey);
        if (!grouped[monthKey]) grouped[monthKey] = 0;
      }

      return months.map((m) => ({
        date: m + "-01",
        sales: grouped[m],
      }));
    }

    // 📅 Yearly: total sales per year, every year in the range is shown
    if (type === "yearly") {
      if (sorted.length === 0) return [];

      const grouped: { [key: string]: number } = {};
      sorted.forEach((item) => {
        const yearKey = dayjs(item.date).format("YYYY");
        grouped[yearKey] = (grouped[yearKey] || 0) + item.sales;
      });

      const firstYear = dayjs(sorted[0].date).year();
      const lastYear = dayjs(sorted[sorted.length - 1].date).year();

      const years: RevenueData[] = [];
      for (let y = firstYear; y <= lastYear; y++) {
        years.push({
          date: `${y}-01-01`,
          sales: grouped[String(y)] || 0,
        });
      }
      return years;
    }

    return sorted;
  };

  const handleDateFilter = (start: Dayjs | null, end: Dayjs | null) => {
    if (!start || !end) return;

    const dates: string[] = [];
    for (
      let d = start.startOf("day");
      d.isSameOrBefore(end.startOf("day"));
      d = d.add(1, "day")
    ) {
      dates.push(d.format("YYYY-MM-DD"));
    }

    const filtered = dates.map((d) => {
      const item = rawData.find((r) => r.date === d);
      return { date: d, sales: item ? item.sales : 0 };
    });

    const diffDays = end.diff(start, "day") + 1;
    const diffMonths = end.diff(start, "month") + 1;

    if (diffMonths > 12) {
      // more than a year selected → show one point per year
      setFilterType("yearly");
      setData(groupData(filtered, "yearly"));
    } else if (diffMonths > 1) {
      setFilterType("monthly");
      setData(groupData(filtered, "monthly"));
    } else if (diffDays > 13) {
      setFilterType("weekly");
      setData(groupData(filtered, "daily"));
    } else {
      setFilterType("daily");
      setData(groupData(filtered, "daily"));
    }
  };

  const totalSales = data.reduce((sum, item) => sum + item.sales, 0);

  const summary = useMemo(() => {
    const valid = data
      .filter((item) => item.sales > 0)
      .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    if (valid.length === 0) return "";

    const isYearly = filterType === "yearly";
    // In yearly view dates are shown as just the year
    const fmt = (date: string, pattern = "MM/DD/YYYY") =>
      dayjs(date).format(isYearly ? "YYYY" : pattern);
    const periodText = isYearly
      ? "this year and last year"
      : "today and yesterday";
    const averageText = isYearly ? "yearly" : "daily";

    const recent = valid.slice(-2); // only keep the last 2 periods
    const highest = recent.reduce((a, b) => (a.sales > b.sales ? a : b));
    const lowest = recent.reduce((a, b) => (a.sales < b.sales ? a : b));
    const last = recent[recent.length - 1];
    const prev = recent.length > 1 ? recent[recent.length - 2] : null;

    let changeText = "-";
    if (prev && prev.sales !== 0) {
      const change = ((last.sales - prev.sales) / prev.sales) * 100;
      const sign = change >= 0 ? "+" : "";
      changeText = `${sign}${change.toFixed(1)}% ${change >= 0 ? "📈" : "📉"}`;
    }

    // 🟢 Analytics only based on recent data
    let analyticsText = "";
    const uniqueSales = [...new Set(recent.map((v) => v.sales))];
    if (uniqueSales.length > 1) {
      const avgSales =
        recent.reduce((sum, v) => sum + v.sales, 0) / recent.length;
      analyticsText = `\n📊 Analytics: The highest sales were recorded on ${fmt(
        highest.date,
        "MMM DD, YYYY",
      )} (₱${highest.sales}), while the lowest were on ${fmt(
        lowest.date,
        "MMM DD, YYYY",
      )} (₱${
        lowest.sales
      }). On average, ${averageText} sales reached around ₱${avgSales.toFixed(
        2,
      )}, showing variable sales activity between ${periodText}.`;
    } else {
      analyticsText = `\n📊 Analytics: Sales were consistent between ${periodText} with no significant variation.`;
    }

    return `
📅 ${fmt(last.date)}: (₱${last.sales}) — ${
      prev
        ? `${changeText} compared to ${fmt(prev.date)}: (₱${prev.sales})`
        : "-"
    }
🔼 Highest: ${fmt(highest.date)} — ₱${highest.sales}
🔽 Lowest: ${fmt(lowest.date)} — ₱${lowest.sales}
💰 Total Sales: ₱${recent.reduce((sum, item) => sum + item.sales, 0)}
${analyticsText}
  `.trim();
  }, [data, filterType]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const dateLabel =
        filterType === "yearly"
          ? dayjs(item.date).format("YYYY")
          : filterType === "monthly"
            ? dayjs(item.date).format("MMM YYYY")
            : dayjs(item.date).format("MMM DD, YYYY");
      return (
        <div className="bg-[#fafafa] dark:bg-gray-800 p-2 border rounded shadow-md text-sm">
          <p>{dateLabel}</p>
          <p>Sales: ₱{item.sales}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative -mx-6 sm:mx-0">
      <div className="bg-[#fafafa] dark:bg-[#001f3f] rounded-lg shadow-lg sm:w-full h-full p-6 flex flex-col transition-colors">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-dotted pb-2">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-[#fafafa]">
            Total Sales (
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)})
          </h2>
          <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-300">
            {dates[0]?.format("MMM DD, YYYY")} →{" "}
            {dates[1]?.format("MMM DD, YYYY")}
          </div>
        </div>

        <div className="flex flex-col justify-center items-center min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={70}
                tickFormatter={(date) =>
                  filterType === "monthly"
                    ? dayjs(date).format("MMM")
                    : dayjs(date).format("MMM DD")
                }
              />
              <YAxis />
              <Tooltip content={CustomTooltip} />
              <Legend align="center" iconType="circle" verticalAlign="top" />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#fa8c16"
                strokeWidth={3}
                name="Sales"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center items-center gap-4 p-1 -mt-4">
          <div className="flex flex-col items-center -mt-2">
            <h3 className="text-sm sm:text-lg font-bold text-green-500">
              ₱{totalSales.toFixed(2)}
            </h3>
            <p className="text-xs text-gray-500">Total Sales</p>
          </div>
        </div>

        <div className="text-sm text-gray-700 whitespace-pre-line mt-1 sm:mt-2">
          {summary}
        </div>
      </div>
    </div>
  );
};

export default WorkerTotalRevenue;
