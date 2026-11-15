import { WorkspaceProvider } from "@/components/workspace-provider";
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorkspaceProvider demo>{children}</WorkspaceProvider>;
}
