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

export interface DebounceConfig {
	delay?: number;
	methods?: string[];
	excludeMethods?: string[];
	key?: 'url' | 'method+url' | 'method+url+body' | ((options: any) => string);
}

export interface DeduplicateConfig {
	keyStrategy?: 'url' | 'url+method' | 'url+method+body' | 'custom';
	keyGenerator?: ((req: any) => string) | null;
	includeHeaders?: string[];
	excludeMethods?: string[];
	methods?: string[] | null;
	cacheTTL?: number;
	maxCacheSize?: number;
	condition?: ((req: any) => boolean) | null;
	disabled?: boolean;
}

export type HedgingPolicy = 'cancel-and-retry' | 'race';

export interface HedgingConfig {
	enabled?: boolean;
	policy?: HedgingPolicy;
	hedgeDelay?: number;
	maxHedges?: number;
	cancelOnSuccess?: boolean;
	includeHttpMethods?: string[] | string;
	serverRotation?: string | string[] | null;
	timeout?: number | null;
	exponentialBackoff?: boolean;
	backoffMultiplier?: number;
	jitter?: boolean;
	jitterRange?: number;
	trackStats?: boolean;
	retryHedgedRequests?: boolean;
}

export interface HedgingMetadata {
	winner: 'primary' | `hedge-${number}`;
	totalAttempts: number;
	latencySaved: number;
	policy: HedgingPolicy;
	type?: 'primary' | 'hedge';
}

export interface HedgingStats {
	totalHedgedRequests: number;
	hedgeSuccessRate: number;
	avgLatencyImprovement: number;
	totalHedgesSent: number;
	cancelledRequests: number;
	hedgesByPolicy: {
		'cancel-and-retry': number;
		race: number;
	};
}

export interface HedgingError extends Error {
	name: 'HedgingError';
	message: string;
	attempts: Array<{
		type: 'primary' | `hedge-${number}`;
		error: string;
	}>;
	policy: HedgingPolicy;
	totalAttempts: number;
}

export interface LuminaraConfig {
	baseURL?: string;
	timeout?: number;
	retry?: number | false;
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
	debounce?: DebounceConfig;
	deduplicate?: DeduplicateConfig;
	hedging?: HedgingConfig;
	query?: Record<string, any>;
	shouldRetry?: (error: Error, context: any) => boolean;
	[key: string]: any;
}

export interface LuminaraResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: Headers;
	hedgingMetadata?: HedgingMetadata;
}

export interface LuminaraContext {
	req: any & { hedging?: HedgingConfig };
	res?: any & { hedgingMetadata?: HedgingMetadata };
	error?: Error | HedgingError;
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

// Hedging type guards
export function isHedgingError(error: any): error is HedgingError;
export function hasHedgingMetadata<T>(response: LuminaraResponse<T>): response is LuminaraResponse<T> & { hedgingMetadata: HedgingMetadata };

// Orchestration components (for benchmarking and advanced usage)
export class PluginPipeline {
	constructor(plugins?: LuminaraPlugin[]);
	add(plugin: LuminaraPlugin): void;
	getAll(): LuminaraPlugin[];
	executeOnRequest(context: LuminaraContext): Promise<void>;
	executeOnResponse(context: LuminaraContext): Promise<void>;
	executeOnResponseError(context: LuminaraContext): Promise<void>;
}

export class RetryOrchestrator {
	constructor(driver: LuminaraDriver, statsEmitter: any);
	execute(context: LuminaraContext, pluginPipeline: PluginPipeline): Promise<any>;
}

export class ContextBuilder {
	static build(mergedReq: any, driver: LuminaraDriver): LuminaraContext;
	static generateRequestId(): string;
	static resetCounter(): void;
}

export class SignalManager {
	static mergeUserSignal(context: LuminaraContext, userSignal?: AbortSignal, statsEmitter?: any): void;
}

export class ConfigManager {
	constructor(initialConfig?: LuminaraConfig);
	merge(req: any): any;
	applyRateLimit(req: any): Promise<void>;
	update(newConfig: Partial<LuminaraConfig>): void;
	getRateLimitStats(): RateLimitStats | null;
	resetRateLimitStats(): void;
}
