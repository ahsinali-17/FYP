import React, { Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getSupabaseUser } from "../supabase";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Layers,
  Smartphone,
  FolderOpen,
} from "lucide-react";
import MetaData from "../components/MetaData";

const DashboardCharts = lazy(
  () => import("../components/dashboard/DashboardCharts"),
);

const Dashboard = () => {
  const navigate = useNavigate();
  const COLORS = ["#22c55e", "#ef4444"];

  // react query fetch
  const { data, isLoading: loading } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => {
      const user = await getSupabaseUser();
      if (!user) throw new Error("No user found");

      const { data: allInspections, error: inspError } = await supabase
        .from("inspections")
        .select(
          "id, created_at, prediction, defect_type, image_url, batch_id, device_name",
        )
        .eq("user_id", user.id);
      if (inspError) throw inspError;

      const { data: allBatches, error: batchError } = await supabase
        .from("batches")
        .select("id, created_at, total_images, batch_name")
        .eq("user_id", user.id);
      if (batchError) throw batchError;

      // Calculate Stats
      const total = allInspections.length;
      const defects = allInspections.filter((i) =>
        i.prediction?.toLowerCase().includes("defect"),
      ).length;
      const clean = total - defects;

      const passFail = [
        { name: "Passed", value: clean },
        { name: "Defective", value: defects },
      ];

      const defectTypeCounts = {};
      allInspections.forEach((item) => {
        if (item.prediction?.toLowerCase().includes("defect")) {
          const typeName = item.defect_type || "Unknown Defect";
          defectTypeCounts[typeName] = (defectTypeCounts[typeName] || 0) + 1;
        }
      });

      const defectTypesArray = Object.keys(defectTypeCounts)
        .map((key) => ({ name: key, count: defectTypeCounts[key] }))
        .sort((a, b) => b.count - a.count);

      const unifiedFeed = [
        ...allInspections
          .filter((i) => !i.batch_id)
          .map((i) => ({
            id: i.id,
            type: "single",
            title: i.device_name || `Scan #${i.id}`,
            date: i.created_at,
            status: i.prediction,
            image: i.image_url,
          })),
        ...allBatches.map((b) => ({
          id: b.id || b.batch_id,
          type: "batch",
          title: `Batch: ${b.batch_name || b.id}`,
          date: b.created_at,
          count: b.total_images,
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      return {
        stats: { total, defects, clean, batches: allBatches.length },
        chartData: { passFail, defectTypes: defectTypesArray },
        recentActivity: unifiedFeed,
      };
    },
  });

  // Default values if data is still fetching
  const stats = data?.stats || { total: 0, defects: 0, clean: 0, batches: 0 };
  const chartData = data?.chartData || { passFail: [], defectTypes: [] };
  const recentActivity = data?.recentActivity || [];

  return (
    <>
      <MetaData
        title="Dashboard"
        description="View your real-time AI inspection analytics."
      />
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
        {/* HERO SECTION */}
        <div className="relative bg-linear-to-br from-slate-900 via-slate-800 to-violet-900 rounded-3xl p-6 md:p-8 text-white shadow-xl overflow-hidden border border-slate-700">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Ready for Inspection?
              </h2>
              <p className="text-slate-300 max-w-lg text-sm md:text-base">
                Run individual device diagnostics or process bulk shipments
                instantly using AI.
              </p>
            </div>
            <button
              onClick={() => navigate("/inspection")}
              className="w-full md:w-auto px-6 py-3 bg-violet-700 hover:bg-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Start New Scan <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard
            title="Total Scans"
            value={stats.total}
            icon={Activity}
            type="blue"
          />
          <StatCard
            title="Defects Found"
            value={stats.defects}
            icon={AlertTriangle}
            type="red"
          />
          <StatCard
            title="Pass Rate"
            value={
              stats.total > 0
                ? `${((stats.clean / stats.total) * 100).toFixed(1)}%`
                : "0%"
            }
            icon={CheckCircle}
            type="green"
          />
          <StatCard
            title="Batches Processed"
            value={stats.batches}
            icon={Layers}
            type="purple"
          />
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Suspense
          fallback={
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 w-full">
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="animate-spin text-violet-300 w-10 h-10" />
                  <span className="text-slate-400 text-sm font-medium">Loading interactive chart...</span>
                </div>
              </div> 

              <div className="bg-white p-6 rounded-2xl border border-slate-100 w-full">
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="animate-spin text-violet-300 w-10 h-10" />
                  <span className="text-slate-400 text-sm font-medium">Loading interactive chart...</span>
                </div>
              </div>
            </>
          }        >
          <DashboardCharts
            loading={loading}
            stats={stats}
            chartData={chartData}
            COLORS={COLORS}
          />
        </Suspense>
      </div>

        {/* 4. UNIFIED RECENT ACTIVITY */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
              <Clock size={18} className="text-violet-500" /> Recent Activity
              Feed
            </h3>
            <button
              onClick={() => navigate("/history")}
              className="text-sm text-violet-700 hover:text-violet-800 font-medium cursor-pointer"
            >
              View History
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                <Loader2 className="animate-spin text-violet-700 w-10 h-10 mb-3" />
                <span className="text-slate-400 text-sm font-medium">
                  Loading recent activity...
                </span>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="p-10 text-center text-slate-400 flex flex-col items-center">
                <Activity className="w-10 h-10 mb-3 opacity-20" />
                <p>No activity recorded yet. Start scanning to see history.</p>
              </div>
            ) : (
              recentActivity.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}-${index}`}
                  className="flex items-center justify-between p-4 md:px-6 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon / Thumbnail Box */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border 
                    ${item.type === "batch" ? "bg-violet-100 border-violet-100 text-violet-500" : "bg-slate-100 border-slate-200 overflow-hidden"}
                  `}
                    >
                      {item.type === "batch" ? (
                        <FolderOpen size={24} />
                      ) : item.image ? (
                        <img
                          src={item.image}
                          alt="Scan"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Smartphone size={24} className="text-slate-400" />
                      )}
                    </div>

                    {/* Text Info */}
                    <div>
                      <p className="font-bold text-slate-800 text-sm md:text-base group-hover:text-violet-700 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        {new Date(item.date).toLocaleDateString()}
                        {item.type === "batch" && (
                          <span className="bg-slate-200 text-slate-700 px-2 rounded-full text-[10px] font-bold">
                            {item.count} images
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge*/}
                  {item.type === "single" && (
                    <StatusBadge status={item.status} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const StatCard = ({ title, value, icon: Icon, type }) => {
  const colors = {
    blue: "bg-violet-100 text-violet-700 border-violet-100",
    red: "bg-red-100 text-red-600 border-red-200",
    green: "bg-emerald-100 text-emerald-600 border-emerald-200",
    purple: "bg-violet-100 text-violet-700 border-violet-100",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl border ${colors[type]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const isDefect =
    status?.toLowerCase().includes("defect") ||
    status?.toLowerCase().includes("damaged");

  return (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
        isDefect
          ? "bg-red-100 text-red-600 border-red-200"
          : "bg-emerald-100 text-emerald-600 border-emerald-200"
      }`}
    >
      {status || "Analyzed"}
    </span>
  );
};

export default Dashboard;
