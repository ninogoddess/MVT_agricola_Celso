import PlanesView from "@/components/planes/PlanesView";

export default function PlanesPage() {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <PlanesView currentPlan="free" />
    </div>
  );
}
