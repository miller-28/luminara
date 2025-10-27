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
        // 1) run all onRequest
        let current = req;
        for (const p of this.plugins) {
            if (p.onRequest) current = await p.onRequest(current);
        }

        // 2) call driver once
        try {
            let res = await this.driver.request(current);

            // 3) run all onSuccess
            for (const p of this.plugins) {
                if (p.onSuccess) res = await p.onSuccess(res);
            }
            return res;
        } catch (err) {
            // 4) run all onError
            for (const p of this.plugins) {
                if (p.onError) await p.onError(err, current);
            }
            throw err;
        }
    }

    // -------- Core verbs --------
    get(url, opts = {})     { return this.request({ ...opts, url, method: "GET" }); }
    post(url, body, opts={}){ return this.request({ ...opts, url, method: "POST", body }); }
    put(url, body, opts = {})   { return this.request({ ...opts, url, method: "PUT", body }); }
    patch(url, body, opts = {}) { return this.request({ ...opts, url, method: "PATCH", body }); }
    del(url, opts = {})         { return this.request({ ...opts, url, method: "DELETE" }); }
    head(url, opts = {})        { return this.request({ ...opts, url, method: "HEAD" }); }
    options(url, opts = {})     { return this.request({ ...opts, url, method: "OPTIONS" }); }

    // -------- Typed GET helpers (response content) --------
    getText(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, 'text/plain', 'text'));
    }
    getJson(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, 'application/json', 'json'));
    }
    getXml(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, 'application/xml, text/xml, application/soap+xml', 'xml'));
    }
    getHtml(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, 'text/html', 'html'));
    }
    getBlob(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, '*/*', 'blob'));
    }
    getArrayBuffer(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, 'application/octet-stream', 'arrayBuffer'));
    }
    // NDJSON: expect driver to stream/iterate, or return text and split lines upstream
    getNDJSON(url, opts = {}) {
        return this.get(url, this.#withAccept(opts, 'application/x-ndjson', 'ndjson'));
    }

    // -------- Typed POST/PUT/PATCH helpers (request content) --------
    postJson(url, data, opts = {}) {
        return this.post(url, JSON.stringify(data), this.#withType(opts, 'application/json', 'json'));
    }
    putJson(url, data, opts = {}) {
        return this.put(url, JSON.stringify(data), this.#withType(opts, 'application/json', 'json'));
    }
    patchJson(url, data, opts = {}) {
        return this.patch(url, JSON.stringify(data), this.#withType(opts, 'application/json', 'json'));
    }

    postText(url, text, opts = {}) {
        return this.post(url, String(text), this.#withType(opts, 'text/plain', 'text'));
    }

    postForm(url, data, opts = {}) {
        const body = data instanceof URLSearchParams ? data : new URLSearchParams(data);
        // note: URLSearchParams auto-encodes; body will be used directly
        return this.post(url, body, this.#withType(opts, 'application/x-www-form-urlencoded', 'text'));
    }

    postMultipart(url, formData, opts = {}) {
        // Important: do NOT set Content-Type; browser sets boundary for FormData.
        const { headers = {}, responseType } = opts;
        const safe = { ...opts, headers: { ...headers }, responseType: responseType ?? 'json' };
        return this.post(url, formData, safe);
    }

    // SOAP 1.1/1.2 helper (XML envelope)
    postSoap(url, xmlString, opts = {}) {
        const { headers = {} } = opts;
        // If user provided SOAPAction, keep it; else omit.
        const hasSoap12 = String(headers['Content-Type'] || '').includes('application/soap+xml');
        const type = hasSoap12 ? 'application/soap+xml' : 'text/xml';
        return this.post(url, xmlString, this.#withType(opts, type, 'xml'));
    }

    // -------- Private helpers --------
    #withAccept(opts, accept, responseType) {
        const headers = { ...(opts.headers || {}) };
        if (!headers['Accept']) headers['Accept'] = accept;
        return { ...opts, headers, responseType: opts.responseType ?? responseType };
    }

    #withType(opts, contentType, defaultResponseType) {
        const headers = { ...(opts.headers || {}) };
        if (!headers['Content-Type']) headers['Content-Type'] = contentType;
        return { ...opts, headers, responseType: opts.responseType ?? defaultResponseType };
    }
}