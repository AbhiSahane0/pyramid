import { TasksScreen } from "@/components/tasks/tasks-screen";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  return <TasksScreen projectId={projectId} storageKey="pyramid-view-project" />;
}
