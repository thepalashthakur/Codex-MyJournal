import type { MapAdapter, MapPoint } from "./types";
export const simpleWorldMap: MapAdapter = {
  id: "local-equirectangular",
  project(point: MapPoint) { return { x: ((point.longitude + 180) / 360) * 1000, y: ((90 - point.latitude) / 180) * 500 }; },
};
