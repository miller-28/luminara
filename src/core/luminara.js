/**
 * @typedef {import('./driver.js').LuminaraRequest} LuminaraRequest
 * @typedef {import('./driver.js').LuminaraResponse} LuminaraResponse
 * @typedef {import('./driver.js').LuminaraDriver} LuminaraDriver
 */

/**
 * @typedef {Object} LuminaraPlugin
 * @property {(req: LuminaraRequest) => (Promise<LuminaraRequest>|LuminaraRequest)} [onRequest]
 * @property {<T>(res: LuminaraResponse) => (Promise<LuminaraResponse>|LuminaraResponse)} [onSuccess]
 * @property {(err: any, req: LuminaraRequest) => (Promise<void>|void)} [onError]
 */

export class LuminaraClient {

    /** @param {LuminaraDriver} driver @param {LuminaraPlugin[]} [plugins] */
    constructor(driver, plugins = []) {
        this.driver = driver;
        this.plugins = plugins;
    }

    /** @param {LuminaraPlugin} plugin */
    use(plugin) { 
        this.plugins.push(plugin); 
        return this; 
    }

    /** @param {LuminaraRequest} req */
    async request(req) {
        let current = req;
        for (const p of this.plugins) if (p.onRequest) current = await p.onRequest(current);
            try {
                let res = await this.driver.request(current);
                for (const p of this.plugins) if (p.onSuccess) res = await p.onSuccess(res);
                return res;
            } catch (err) {
                for (const p of this.plugins) if (p.onError) await p.onError(err, current);
                throw err;
           }
        }

    get(url, opts = {}) { 
        return this.request({ ...opts, url, method: "GET" }); 
    }
    post(url, body, opts = {}) { 
        return this.request({ ...opts, url, method: "POST", body }); 
    }
}