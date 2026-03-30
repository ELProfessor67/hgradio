/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useData } from "@/context/Context";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { FaUsers, FaUserSecret, FaShoppingCart, FaClipboardList } from "react-icons/fa";
import { PageLoading } from "@/utils/Loading";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const DashboardStats = () => {
  const { userData } = useData();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData?.token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/analytics/stats`, {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userData?.token]);

  if (loading) return <PageLoading />;
  if (!stats) return <div className="text-white">Failed to load statistics.</div>;

  const pieData = [
    { name: "Approved", value: stats.sellerStatus.approved },
    { name: "Pending", value: stats.sellerStatus.pending },
    { name: "Rejected", value: stats.sellerStatus.rejected },
  ];

  const lineData = stats.monthlyRegistrations.map((item: any) => ({
    name: `${item._id.month}/${item._id.year}`,
    registrations: item.count,
  }));

  const cards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <FaUsers className="text-blue-500" />,
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Total Sellers",
      value: stats.totalSellers,
      icon: <FaUserSecret className="text-green-500" />,
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      title: "Total Buyers",
      value: stats.totalBuyers,
      icon: <FaShoppingCart className="text-amber-500" />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Pending Requests",
      value: stats.sellerStatus.pending,
      icon: <FaClipboardList className="text-purple-500" />,
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-xl border ${card.border} ${card.bg} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{card.value}</h3>
              </div>
              <div className="p-3 rounded-lg bg-black/20 text-2xl">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Registration Trend Chart */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0b1834]/60 backdrop-blur-md">
          <h3 className="text-xl font-semibold text-white mb-6">Registration Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FE" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                   stroke="#94a3b8" 
                   fontSize={12}
                   tickLine={false}
                   axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#071126", border: "1px solid #ffffff20", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#0088FE" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorReg)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seller Status Chart */}
        <div className="p-6 rounded-xl border border-white/10 bg-[#0b1834]/60 backdrop-blur-md">
          <h3 className="text-xl font-semibold text-white mb-6">Seller Application Status</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#071126", border: "1px solid #ffffff20", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown Bar Chart */}
      <div className="p-6 rounded-xl border border-white/10 bg-[#0b1834]/60 backdrop-blur-md">
        <h3 className="text-xl font-semibold text-white mb-6">Seller Type Overview</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Total Buyers", count: stats.totalBuyers },
                { name: "Total Sellers", count: stats.totalSellers },
                { name: "Approved Sellers", count: stats.sellerStatus.approved },
                { name: "Pending Sellers", count: stats.sellerStatus.pending },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{fill: '#ffffff05'}}
                contentStyle={{ backgroundColor: "#071126", border: "1px solid #ffffff20", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Cell fill="#0088FE" />
                <Cell fill="#00C49F" />
                <Cell fill="#FFBB28" />
                <Cell fill="#FF8042" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
