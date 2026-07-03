import { BookOpen, ClipboardList, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/admin/stat-card";
import { ModuleDirectory } from "./module-directory";
import { AssignmentTracker } from "./assignment-tracker";
import { SurveyDirectory } from "./survey-directory";
import type {
  AdminTrainingModule,
  TrainingAssignmentSummary,
  AdminSurvey,
} from "@/types/admin";

export function TrainingConsole({
  modules,
  assignments,
  surveys,
}: {
  modules: AdminTrainingModule[];
  assignments: TrainingAssignmentSummary[];
  surveys: AdminSurvey[];
}) {
  const completed = assignments.filter((a) => a.status === "completed").length;
  const overdue = assignments.filter((a) => a.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Training modules"
          value={modules.length}
          icon={BookOpen}
          tone="brand"
        />
        <StatCard
          label="Completed assignments"
          value={completed}
          icon={GraduationCap}
          tone="accent"
          hint={`${assignments.length} total`}
        />
        <StatCard
          label="Overdue"
          value={overdue}
          icon={ClipboardList}
          tone={overdue > 0 ? "critical" : "neutral"}
        />
      </div>

      <Tabs defaultValue="modules">
        <TabsList className="flex-wrap">
          <TabsTrigger value="modules">
            <BookOpen className="h-4 w-4" />
            Modules
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <GraduationCap className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="surveys">
            <ClipboardList className="h-4 w-4" />
            Surveys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <ModuleDirectory modules={modules} />
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentTracker assignments={assignments} />
        </TabsContent>
        <TabsContent value="surveys">
          <SurveyDirectory surveys={surveys} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
