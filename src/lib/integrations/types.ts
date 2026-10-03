export interface WeatherSnapshot { temperatureC?: number; condition?: string; humidity?: number; observedAt: string; provider: string }
export interface WeatherProvider { id: string; getWeather(input: { latitude: number; longitude: number; at: Date }): Promise<WeatherSnapshot> }
export interface MapPoint { id: string; latitude: number; longitude: number; label: string }
export interface MapAdapter { id: string; project(point: MapPoint): { x: number; y: number } }
export interface JournalImporter { id: string; validate(input: unknown): Promise<{ valid: boolean; errors: string[] }>; parse(input: unknown): AsyncIterable<unknown> }
export interface JournalExporter { id: string; contentType: string }
export interface IntegrationProvider { id: string; name: string; capabilities: string[] }
