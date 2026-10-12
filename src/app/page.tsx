import ExperienceLoader from "@/components/ExperienceLoader";
import Overlay from "@/components/Overlay";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <ExperienceLoader />
      <Overlay />
    </main>
  );
}
