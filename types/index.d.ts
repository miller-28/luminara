// Type definitions for Luminara
export interface LuminaraConfig {
	baseURL?: string;
	timeout?: number;
	retry?: number;
	retryDelay?: number | ((retryCount: number, error: Error, context: any) => number | Promise<number>);
	retryStatusCodes?: number[];
	backoffType?: 'linear' | 'exponential' | 'exponentialCapped' | 'fibonacci' | 'jitter' | 'exponentialJitter';
	backoffBaseDelay?: number;
	backoffMaxDelay?: number;
	headers?: Record<string, string>;
	responseType?: 'auto' | 'text' | 'json' | 'blob' | 'stream' | 'arrayBuffer';
	parseResponse?: (text: string, response: Response) => any;
	ignoreResponseError?: boolean;
	[key: string]: any;
}

export interface LuminaraResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: Headers;
}

export interface LuminaraPlugin {
	onRequest?: (request: any) => any | Promise<any>;
	onSuccess?: (response: any) => any | Promise<any>;
	onError?: (error: Error, request: any) => any | Promise<any>;
}

export interface LuminaraDriver {
	request(options: any): Promise<LuminaraResponse>;
}

export class LuminaraClient {
	constructor(driver: LuminaraDriver, plugins: LuminaraPlugin[], config: LuminaraConfig);
	
	use(plugin: LuminaraPlugin): this;
	
	request<T = any>(options: LuminaraConfig & { 
		url?: string; 
		method?: string; 
		body?: any; 
		signal?: AbortSignal; 
	}): Promise<LuminaraResponse<T>>;
	
	get<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	post<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	put<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	patch<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	delete<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	
	// Convenience methods
	getJson<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<T>;
	getText(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<string>;
	getBlob(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<Blob>;
	getStream(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<ReadableStream>;
	getArrayBuffer(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<ArrayBuffer>;
	
	postJson<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<T>;
	postForm<T = any>(url: string, formData: FormData, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
}

// Factory function
export function createLuminara(config?: LuminaraConfig): LuminaraClient;

// Driver exports
export function NativeFetchDriver(config?: LuminaraConfig): LuminaraDriver;
export function OfetchDriver(config?: LuminaraConfig): LuminaraDriver;

// Backoff strategies
export function linearBackoff(retryCount: number, baseDelay?: number): number;
export function exponentialBackoff(retryCount: number, baseDelay?: number): number;
export function exponentialCappedBackoff(retryCount: number, baseDelay?: number, maxDelay?: number): number;
export function fibonacciBackoff(retryCount: number, baseDelay?: number): number;
export function jitterBackoff(retryCount: number, baseDelay?: number): number;
export function exponentialJitterBackoff(retryCount: number, baseDelay?: number, maxDelay?: number): number;
export function createBackoffHandler(backoffType: string, baseDelay: number, maxDelay?: number): (context: any) => number;