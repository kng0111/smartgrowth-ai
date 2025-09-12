"use client";

import { useEffect, useState, useRef } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from "recharts";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type DashboardData = {
  users: any[];
  planDistribution: Record<string, number>;
  activeUsers: any[];
  churnRisk: any[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  // Refs for export
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("❌ Fetch error:", err));
  }, []);

  if (!data) return <p className="p-6">Loading dashboard...</p>;

  // Pie chart data
  const planData = Object.entries(data.planDistribution).map(([plan, count]) => ({
    name: plan,
    value: count,
  }));
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  // Bar chart data
  const activeUsers = data.activeUsers.map((u) => ({
    name: u.email.split("@")[0],
    actions: u.total_actions,
  }));

  // Line chart (latency trend)
  const latencyTrend = data.users.slice(0, 7).map((u, idx) => ({
    day: `Day ${idx + 1}`,
    latency: u.avg_latency_ms || Math.random() * 500,
  }));

  // --- Export Functions ---
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "dashboard-data.json");
  };

  const exportCSV = () => {
    const rows = [
      ["email", "plan", "total_actions", "successful_actions", "failed_actions", "avg_latency_ms", "last_activity"],
      ...data.users.map((u) => [
        u.email,
        u.plan,
        u.total_actions,
        u.successful_actions,
        u.failed_actions,
        u.avg_latency_ms,
        u.last_activity,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "dashboard-data.csv");
  };

  const exportChart = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current);
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, filename);
    });
  };

  const exportPDF = async () => {
    if (!pageRef.current) return;
    const canvas = await html2canvas(pageRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("dashboard-report.pdf");
  };

  return (
    <div className="p-8 space-y-10" ref={pageRef}>
      <h1 className="text-3xl font-bold">📊 SmartGrowth AI Dashboard</h1>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={exportJSON} className="bg-blue-500 text-white px-4 py-2 rounded">
          Export JSON
        </button>
        <button onClick={exportCSV} className="bg-green-500 text-white px-4 py-2 rounded">
          Export CSV
        </button>
        <button onClick={exportPDF} className="bg-red-500 text-white px-4 py-2 rounded">
          Export PDF Report
        </button>
      </div>

      {/* Plan Distribution */}
      <div ref={pieRef} className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Plan Distribution</h2>
        <PieChart width={400} height={300}>
          <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
            {planData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      {/* Top Active Users */}
      <div ref={barRef} className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Top Active Users</h2>
        <BarChart width={600} height={300} data={activeUsers}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="actions" fill="#82ca9d" />
        </BarChart>
      </div>

      {/* Latency Trend */}
      <div ref={lineRef} className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Latency Trend (ms)</h2>
        <LineChart width={600} height={300} data={latencyTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="latency" stroke="#8884d8" />
        </LineChart>
      </div>

      {/* Churn Risk Users */}
      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Churn Risk Users</h2>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Plan</th>
              <th className="border p-2 text-left">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {data.churnRisk.map((u, i) => (
              <tr key={i}>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">{u.plan}</td>
                <td className="border p-2">{u.last_activity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
