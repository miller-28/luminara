/**
 * @typedef {Object} LuminaraRequest
 * @property {string} url
 * @property {string} [method]
 * @property {Record<string,string>} [headers]
 * @property {Record<string,any>} [query]
 * @property {any} [body]
 * @property {AbortSignal} [signal]
 * @property {number} [timeoutMs]
 */

/**
 * @typedef {Object} LuminaraResponse
 * @property {number} status
 * @property {Headers} headers
 * @property {any} data
 */

/**
 * @typedef {{ request: (opts: LuminaraRequest) => Promise<LuminaraResponse> }} LuminaraDriver
 */
export {};