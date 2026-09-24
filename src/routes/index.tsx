import { createFileRoute } from "@tanstack/react-router";
import { AllFour } from "@/components/all-four";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <AllFour />;
}
