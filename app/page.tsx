import { getPostLocations, getTravelRoutes, getTravelStats } from "@/lib/posts";
import HomeClient from "./components/HomeClient";

export default async function Home() {
  const locations = await getPostLocations();
  const routes = await getTravelRoutes();
  const stats = await getTravelStats();

  return (
    <HomeClient locations={locations} routes={routes} stats={stats} />
  );
}
