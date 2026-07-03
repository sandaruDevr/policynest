import {
  ActivityApi,
  AssistantApi,
  ComplianceApi,
  FeedbackApi,
  NotificationsApi,
  ProfileApi,
  QuickRefApi,
} from "@/lib/api-contracts";
import { WelcomeStrip } from "@/components/home/welcome-strip";
import { QuickAsk } from "@/components/home/quick-ask";
import { PriorityActions } from "@/components/home/priority-actions";
import { ContinueSection } from "@/components/home/continue-section";
import { ComplianceSnapshot } from "@/components/home/compliance-snapshot";
import { QuickRefGrid } from "@/components/home/quick-ref-grid";
import { BroadcastsAndSurveys } from "@/components/home/broadcasts-surveys";

export const metadata = { title: "Home · Policy Nest" };

export default async function StaffHomePage() {
  const [
    profile,
    prompts,
    items,
    summary,
    quickRefs,
    activity,
    notifications,
    surveys,
  ] = await Promise.all([
    ProfileApi.getMe().then((r) => r.data),
    AssistantApi.suggestedPrompts().then((r) => r.data),
    ComplianceApi.items().then((r) => r.data),
    ComplianceApi.summary().then((r) => r.data),
    QuickRefApi.list().then((r) => r.data),
    ActivityApi.list().then((r) => r.data),
    NotificationsApi.list().then((r) => r.data),
    FeedbackApi.surveys().then((r) => r.data),
  ]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <WelcomeStrip profile={profile} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <QuickAsk prompts={prompts} />
          <PriorityActions items={items} />
          <QuickRefGrid items={quickRefs} />
        </div>
        <div className="space-y-6 lg:col-span-4">
          <ComplianceSnapshot summary={summary} />
          <ContinueSection items={activity} />
        </div>
      </div>

      <BroadcastsAndSurveys notifications={notifications} surveys={surveys} />
    </div>
  );
}
