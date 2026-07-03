import { PageHeader } from "@/components/shared/page-header";
import { TrainingConsole } from "@/components/admin/training/training-console";
import {
  listTrainingModules,
  listTrainingAssignments,
  listSurveys,
} from "@/lib/data/admin/training";

export const metadata = { title: "Training & Surveys · Policy Nest Admin" };
export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const [modules, assignments, surveys] = await Promise.all([
    listTrainingModules(),
    listTrainingAssignments("all"),
    listSurveys(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workforce"
        title="Training & Surveys"
        description="Manage training modules, track assignments, and monitor survey completion."
      />
      <TrainingConsole
        modules={modules}
        assignments={assignments}
        surveys={surveys}
      />
    </div>
  );
}
