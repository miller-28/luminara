// Type definitions for Luminara

export interface RateLimitBucketStats {
	tokens: number;
	queued: number;
	inFlight: number;
}

export interface RateLimitStats {
	queued: number;
	dispatched: number;
	dropped: number;
	inFlight: number;
	buckets: Record<string, RateLimitBucketStats>;
	config: {
		limit: number;
		windowMs: number;
		burst: number;
		ratePerMs: number;
		scope: 'global' | 'domain' | 'endpoint';
		maxConcurrent: number | null;
		queueLimit: number | null;
		tickMs: number;
		include?: string[];
		exclude?: string[];
		verbose: boolean;
	};
}

export interface RateLimitConfig {
	rps?: number;
	rpm?: number;
	limit?: number;
	windowMs?: number;
	burst?: number;
	scope?: 'global' | 'domain' | 'endpoint';
	maxConcurrent?: number;
	queueLimit?: number;
	tickMs?: number;
	include?: string[];
	exclude?: string[];
	verbose?: boolean;
}

export interface LuminaraConfig {
	baseURL?: string;
	timeout?: number;
	retry?: number;
	retryDelay?: number | ((retryCount: number, error: Error, context: any) => number | Promise<number>);
	retryStatusCodes?: number[];
	backoffType?: 'linear' | 'exponential' | 'exponentialCapped' | 'fibonacci' | 'jitter' | 'exponentialJitter';
	backoffBaseDelay?: number;
	backoffMaxDelay?: number;
	initialDelay?: number;
	headers?: Record<string, string>;
	responseType?: 'auto' | 'text' | 'json' | 'blob' | 'stream' | 'arrayBuffer' | 'xml' | 'html' | 'ndjson';
	parseResponse?: (text: string, response: Response) => any;
	ignoreResponseError?: boolean;
	verbose?: boolean;
	statsEnabled?: boolean;
	rateLimit?: RateLimitConfig;
	query?: Record<string, any>;
	shouldRetry?: (error: Error, context: any) => boolean;
	[key: string]: any;
}

export interface LuminaraResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: Headers;
}

export interface LuminaraContext {
	req: any;
	res?: any;
	error?: Error;
	meta: {
		requestId: string;
		requestStartTime: number;
		attempt: number;
	};
}

export interface LuminaraPlugin {
	name?: string;
	onRequest?: (context: LuminaraContext) => any | Promise<any>;
	onResponse?: (context: LuminaraContext) => void | Promise<void>;
	onResponseError?: (context: LuminaraContext) => void | Promise<void>;
}

export interface LuminaraDriver {
	request(options: any): Promise<LuminaraResponse>;
	calculateRetryDelay?: (context: any) => Promise<number> | number;
}

export interface StatsInterface {
	get(): any;
	reset(): void;
	query(params: any): any;
}

export interface LuminaraClient {
	
	constructor(driver: LuminaraDriver, plugins: LuminaraPlugin[], config: LuminaraConfig);
	
	use(plugin: LuminaraPlugin): this;
	
	updateConfig(config: Partial<LuminaraConfig>): this;
	
	stats(): StatsInterface;
	enableStats(): this;
	disableStats(): this;
	isStatsEnabled(): boolean;
	
	getRateLimitStats(): RateLimitStats | null;
	resetRateLimitStats(): void;
	
	request<T = any>(options: LuminaraConfig & { 
		url?: string; 
		method?: string; 
		body?: any; 
		signal?: AbortSignal; 
	}): Promise<LuminaraResponse<T>>;
	
	// Core HTTP methods
	get<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	post<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	put<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	patch<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	del<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	head<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	options<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	
	// Typed GET helpers (response content)
	getJson<T = any>(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<T>;
	getText(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<string>;
	getXml(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<string>;
	getHtml(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<string>;
	getBlob(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<Blob>;
	getArrayBuffer(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<ArrayBuffer>;
	getNDJSON(url: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<string>;
	
	// Typed POST/PUT/PATCH helpers (request content)
	postJson<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<T>;
	putJson<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<T>;
	patchJson<T = any>(url: string, body?: any, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<T>;
	postText<T = any>(url: string, text: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	postForm<T = any>(url: string, data: FormData | Record<string, any>, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	postMultipart<T = any>(url: string, formData: FormData, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
	postSoap<T = any>(url: string, xmlString: string, options?: LuminaraConfig & { signal?: AbortSignal }): Promise<LuminaraResponse<T>>;
}

// Factory function
export function createLuminara(config?: LuminaraConfig): LuminaraClient;

// Driver export
export function NativeFetchDriver(config?: LuminaraConfig): LuminaraDriver;

// Backoff strategies
export function createBackoffHandler(backoffType: string, baseDelay: number, backoffMaxDelay?: number, backoffDelays?: number[], initialDelay?: number): (context: any) => number;

// Backoff strategies object export
export const backoffStrategies: {
	linear: (retryCount: number, retryDelay?: number) => number;
	exponential: (retryCount: number, retryDelay?: number) => number;
	exponentialCapped: (retryCount: number, retryDelay?: number, maxDelay?: number) => number;
	fibonacci: (retryCount: number, retryDelay?: number) => number;
	custom: (retryCount: number, retryDelay?: number, maxDelay?: number, backoffDelays?: number[]) => number;
	jitter: (retryCount: number, retryDelay?: number) => number;
	exponentialJitter: (retryCount: number, retryDelay?: number, maxDelay?: number) => number;
};

// Retry policy utilities
export function defaultRetryPolicy(error: Error, context: any): boolean;
export function createRetryPolicy(options: any): (error: Error, context: any) => boolean;
export function parseRetryAfter(retryAfterHeader: string): number;
export function isIdempotentMethod(method: string): boolean;

// Constants
export const IDEMPOTENT_METHODS: Set<string>;
export const DEFAULT_RETRY_STATUS_CODES: Set<number>;

// Stats system exports
export class StatsHub {
	setVerbose(enabled: boolean): void;
	get(): any;
	reset(): void;
	query(params: any): any;
}

export const METRIC_TYPES: {
	COUNTER: string;
	RATE: string;
	TIME: string;
	ERROR: string;
	RETRY: string;
};

export const GROUP_BY_DIMENSIONS: string[];
export const TIME_WINDOWS: string[];