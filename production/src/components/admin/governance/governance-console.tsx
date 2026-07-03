"use client";

import {
  Activity,
  BookCheck,
  Gauge,
  MessageSquareWarning,
  Settings2,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/admin/stat-card";
import { HitlReview } from "./hitl-review";
import { GoldenAnswers } from "./golden-answers";
import { AiSettings } from "./ai-settings";
import { AiActivity } from "./ai-activity";
import type {
  AiActivityEntry,
  AiActivityMetrics,
  GoldenAnswer,
  HitlItem,
  TenantAiSettings,
} from "@/types/admin";

export function GovernanceConsole({
  metrics,
  hitlItems,
  goldenAnswers,
  settings,
  activity,
}: {
  metrics: AiActivityMetrics;
  hitlItems: HitlItem[];
  goldenAnswers: GoldenAnswer[];
  settings: TenantAiSettings;
  activity: AiActivityEntry[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Queries (30d)"
          value={metrics.totalQueries}
          icon={TrendingUp}
          tone="brand"
        />
        <StatCard
          label="Pending review"
          value={metrics.pendingReviews}
          icon={MessageSquareWarning}
          tone={metrics.pendingReviews > 0 ? "warn" : "neutral"}
          hint={`${(metrics.escalationRate * 100).toFixed(0)}% escalation rate`}
        />
        <StatCard
          label="Avg confidence"
          value={
            metrics.avgConfidence != null
              ? `${Math.round(metrics.avgConfidence * 100)}%`
              : "—"
          }
          icon={Gauge}
          tone={
            metrics.avgConfidence != null && metrics.avgConfidence >= 0.85
              ? "accent"
              : "warn"
          }
        />
        <StatCard
          label="Golden answers"
          value={metrics.activeGoldenAnswers}
          icon={BookCheck}
          tone="info"
        />
      </div>

      <Tabs defaultValue="review">
        <TabsList className="flex-wrap">
          <TabsTrigger value="review">
            <MessageSquareWarning className="h-4 w-4" />
            Review queue
            {metrics.pendingReviews > 0 ? (
              <span className="ml-1 rounded-full bg-warn-500/20 px-1.5 text-[10px] text-warn-400">
                {metrics.pendingReviews}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="golden">
            <BookCheck className="h-4 w-4" />
            Golden answers
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 className="h-4 w-4" />
            AI settings
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <HitlReview items={hitlItems} />
        </TabsContent>
        <TabsContent value="golden">
          <GoldenAnswers answers={goldenAnswers} />
        </TabsContent>
        <TabsContent value="settings">
          <AiSettings settings={settings} />
        </TabsContent>
        <TabsContent value="activity">
          <AiActivity entries={activity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
