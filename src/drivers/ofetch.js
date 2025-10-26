import { ofetch } from "ofetch";

/** @returns {import('../core/driver.js').LuminaraDriver} */
export function OfetchDriver() {

    // Customize ofetch instance once; users/plugins can hook via Luminara.
    const api = ofetch.create({
        // ofetch has native hooks; we keep them minimal here and
        // expose Luminara's plugin layer above.
        onRequest() {},
        onResponse() {},
        onResponseError() {}
    });

    return {
        async request(opts) {
            const { url, method = "GET", headers, query, body, signal } = opts;
            // Note: ofetch throws on non-2xx; we'll normalize in Luminara layer if needed.
            const data = await api(url, { method, headers, query, body, signal });
            // ofetch returns parsed body; raw headers/status require raw mode.
            // For now we return a minimal normalized shape.
            return { status: 200, headers: new Headers(), data };
        }
    };
}