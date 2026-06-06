"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DashboardLayout from "../../components/dashboard-layout";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  FileText,
  Clock,
  Activity,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  TrendingUp,
  Award,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  reviewers: { id: string }[];
}

interface Analytics {
  hasData: boolean;
  stats: {
    totalXP: number;
    level: number;
    totalSessions: number;
    totalTimeMinutes: number;
    averageAccuracy: number;
  };
  modePerformance: { mode: string; accuracy: number }[];
  weeklyProgress: { date: string; xp: number; time: number }[];
}

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Fetch documents and analytics
  const fetchDashboardData = useCallback(async () => {
    try {
      const docsRes = await fetch("/api/reviewers");
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      const analyticsRes = await fetch("/api/analytics");
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Poll for document status if there are any processing files
  useEffect(() => {
    const hasProcessing = documents.some((doc) => doc.status === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetch("/api/reviewers")
        .then((res) => res.json())
        .then((data) => {
          if (data.documents) {
            setDocuments(data.documents);
            // If any finished processing, fetch analytics too
            const newlyFinished = data.documents.some(
              (doc: any) =>
                doc.status === "COMPLETED" &&
                documents.find((d) => d.id === doc.id)?.status === "PROCESSING"
            );
            if (newlyFinished) {
              fetch("/api/analytics")
                .then((r) => r.json())
                .then(setAnalytics);
            }
          }
        });
    }, 4000);

    return () => clearInterval(interval);
  }, [documents]);

  // Handle Drag-and-Drop file uploads
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgress(10); // Start visual tracker

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(30);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      setUploadProgress(70);

      const data = await res.json();
      setUploadProgress(100);

      if (!res.ok) {
        setUploadError(data.error || "Upload failed.");
      } else {
        // Clear progress bar
        setTimeout(() => setUploadProgress(null), 1000);
        // Refresh list
        fetchDashboardData();
      }
    } catch {
      setUploadError("A network error occurred. Please try again.");
    } finally {
      setTimeout(() => setUploadProgress(null), 1500);
    }
  }, [fetchDashboardData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Handle document deletion
  const handleDeleteDoc = async (docId: string, reviewerId?: string) => {
    if (!confirm("Are you sure you want to delete this reviewer? All associated assessments and progress logs will be lost permanently.")) {
      return;
    }

    try {
      // If document is COMPLETED, we delete via the reviewer ID
      // If it is PROCESSING or FAILED, we must delete it. Let's make sure we support both.
      // Since our DELETE /api/reviewers/[id] takes reviewer ID, if the document has no reviewer (failed/processing),
      // we can delete it. Wait, let's look at the DELETE route.
      // The DELETE `/api/reviewers/[id]` deletes by reviewer ID.
      // If we don't have a reviewer ID, we can delete the document directly.
      // Wait, let's verify if we created an endpoint for document deletion.
      // In `app/api/reviewers/[id]/route.ts`, the DELETE method takes the Reviewer ID, finds the reviewer, and deletes the associated Document.
      // What if the document is FAILED/PROCESSING? It has NO reviewer record!
      // So to delete failed documents, we can add a fallback or update our DELETE route to support deleting by either Document ID or Reviewer ID.
      // Wait, let's create a separate delete endpoint or handle it cleanly.
      // Let's check: in `app/api/reviewers/[id]/route.ts` the delete was:
      // const reviewer = await prisma.reviewer.findFirst({ where: { id, userId: user.id } });
      // If reviewer is not found, we can check if there's a document with this ID!
      // That's extremely smart! Let's update `app/api/reviewers/[id]/route.ts` to support both documentId and reviewerId.
      // Let's do that next. But first let's see how we write the dashboard delete.
      // We will call DELETE `/api/reviewers/${id}`. If the document is COMPLETED, we pass the reviewer.id.
      // If it is FAILED or PROCESSING, we pass the document.id. In the endpoint, we will check if it matches a document or a reviewer and delete!
      const idToDelete = reviewerId || docId;
      
      const res = await fetch(`/api/reviewers/${idToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
        fetchDashboardData();
      } else {
        alert("Failed to delete the document.");
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <span className="text-red-500 font-extrabold text-xs">PDF</span>;
      case "docx":
        return <span className="text-blue-500 font-extrabold text-xs">DOCX</span>;
      case "pptx":
        return <span className="text-orange-500 font-extrabold text-xs">PPTX</span>;
      default:
        return <span className="text-zinc-500 font-extrabold text-xs">TXT</span>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // SVG Chart Calculation Helper
  const maxWeeklyXp = analytics?.weeklyProgress.reduce((max, d) => Math.max(max, d.xp), 0) || 100;
  const chartHeight = 120;
  const chartWidth = 360;

  return (
    <DashboardLayout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Study Dashboard</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Analyze your study trends, upload documents, and review generated quiz assets.
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">XP Level</span>
              <span className="text-2xl font-extrabold mt-0.5 block">Level {analytics?.stats?.level || 1}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-xl">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Study Quizzes</span>
              <span className="text-2xl font-extrabold mt-0.5 block">{analytics?.stats?.totalSessions || 0} taken</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Hours</span>
              <span className="text-2xl font-extrabold mt-0.5 block">{analytics?.stats?.totalTimeMinutes || 0}m spent</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Avg. Accuracy</span>
              <span className="text-2xl font-extrabold mt-0.5 block">{analytics?.stats?.averageAccuracy || 0}%</span>
            </div>
          </div>
        </div>

        {/* Dashboard Center (Upload & Charts) */}
        <div className="grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Upload Box */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col flex-1">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-500" /> Ingest Study Material
              </h3>

              {uploadError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Dropzone Container */}
              <div
                {...getRootProps()}
                className={`flex-1 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-500/5"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10"
                }`}
              >
                <input {...getInputProps()} />
                
                {uploadProgress !== null ? (
                  <div className="flex flex-col items-center w-full max-w-[240px]">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                      Uploading material...
                    </p>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-2xl text-zinc-400 dark:text-zinc-500 mb-4 border border-zinc-200/20 dark:border-zinc-800/20">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Drag & Drop study files here
                    </p>
                    <p className="text-xs text-zinc-400 mt-1.5">
                      or click to browse local files
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-4 uppercase font-semibold tracking-wider">
                      PDF, DOCX, PPTX, TXT up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* SVG Progress Graph */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col flex-1">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" /> Weekly Activity Overview
              </h3>

              {analytics?.hasData ? (
                <div className="flex-1 flex flex-col justify-between pt-4">
                  {/* SVG Chart */}
                  <div className="relative w-full h-[130px] flex items-end">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1="0" y1="0" x2={chartWidth} y2="0" stroke="rgba(128,128,128,0.1)" strokeDasharray="4" />
                      <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(128,128,128,0.1)" strokeDasharray="4" />
                      <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(128,128,128,0.2)" />

                      {/* Bars */}
                      {analytics.weeklyProgress.map((day, idx) => {
                        const barWidth = 24;
                        const spacing = chartWidth / 7;
                        const x = idx * spacing + (spacing - barWidth) / 2;
                        
                        // Calculate bar height dynamically
                        const ratio = Math.max(day.xp / maxWeeklyXp, 0.05); // Minimum visual height
                        const barHeight = chartHeight * ratio;
                        const y = chartHeight - barHeight;

                        return (
                          <g key={day.date} className="group/bar">
                            {/* Hover tooltip */}
                            <title>{`${day.xp} XP earned (${day.time} mins)`}</title>
                            
                            {/* Visual Bar */}
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              rx="6"
                              className="fill-indigo-500/80 hover:fill-indigo-500 dark:fill-indigo-500/20 dark:hover:fill-indigo-500/50 transition-all duration-300 cursor-pointer"
                            />
                            
                            {/* Text labels under the bars */}
                            <text
                              x={x + barWidth / 2}
                              y={chartHeight + 18}
                              textAnchor="middle"
                              className="text-[10px] fill-zinc-400 dark:fill-zinc-500 font-bold"
                            >
                              {day.date}
                            </text>
                            
                            {/* XP Text on top of hover */}
                            {day.xp > 0 && (
                              <text
                                x={x + barWidth / 2}
                                y={y - 6}
                                textAnchor="middle"
                                className="text-[9px] fill-indigo-500 font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200"
                              >
                                {day.xp}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-950 pt-4 mt-4">
                    <span>Active Study Time: {analytics.stats.totalTimeMinutes}m</span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" /> Earned XP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                  <Activity className="h-8 w-8 text-zinc-500 mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No data logged yet</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Complete your first assessment set to start tracking analytics.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Reviewers Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5.5 w-5.5 text-zinc-700 dark:text-zinc-300" /> Saved Reviewers
          </h3>

          {loadingDocs ? (
            <div className="flex h-40 items-center justify-center bg-white dark:bg-[#0c0c12] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 text-zinc-400 flex flex-col items-center justify-center">
              <FileText className="h-10 w-10 text-zinc-500 mb-3 opacity-40" />
              <p className="text-sm font-semibold">No reviewer notes found</p>
              <p className="text-xs text-zinc-500 mt-1">Upload a PDF, DOCX, PPTX, or TXT file above to generate your first study guide!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => {
                const reviewerId = doc.reviewers[0]?.id;
                const isProcessing = doc.status === "PROCESSING";
                const isFailed = doc.status === "FAILED";
                const isCompleted = doc.status === "COMPLETED";

                return (
                  <div
                    key={doc.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-[#0c0c12] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex flex-col relative group interactive-card ${
                      isProcessing ? "border-indigo-500/30 animate-pulse" : ""
                    }`}
                  >
                    {/* Header: File Extension & Actions */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-extrabold text-[10px] tracking-wider uppercase">
                        {getFileIcon(doc.fileType)}
                      </div>
                      
                      <button
                        onClick={() => handleDeleteDoc(doc.id, reviewerId)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                        title="Delete Reviewer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Title */}
                    <h4 className="font-extrabold text-base mb-1 truncate text-zinc-800 dark:text-zinc-100 pr-4" title={doc.title}>
                      {doc.title}
                    </h4>

                    {/* File Meta */}
                    <span className="text-[11px] text-zinc-400 font-semibold block mb-6">
                      {formatBytes(doc.fileSize)} &bull; {new Date(doc.createdAt).toLocaleDateString()}
                    </span>

                    {/* Bottom Status / CTA Button */}
                    <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-950 flex items-center justify-between">
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-indigo-500 text-xs font-semibold">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating notes...</span>
                        </div>
                      )}

                      {isFailed && (
                        <div className="flex items-center gap-1.5 text-rose-500 text-xs font-semibold">
                          <AlertCircle className="h-4 w-4" />
                          <span>Generation failed</span>
                        </div>
                      )}

                      {isCompleted && reviewerId && (
                        <>
                          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Notes Ready</span>
                          </div>
                          
                          <Link
                            href={`/reviewer/${reviewerId}`}
                            className="flex items-center justify-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all text-white cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-current" /> Study
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
