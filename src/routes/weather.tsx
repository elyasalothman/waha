import { createFileRoute } from "@tanstack/react-router";
import { WeatherBoard } from "@/components/os/weather-board";

export const Route = createFileRoute("/weather")({ component: WeatherPage });

function WeatherPage() {
  return <WeatherBoard />;
}
