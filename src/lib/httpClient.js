/**
 * @module lib/httpClient
 * Centralized HTTP POST abstraction with JSON headers, AbortController timeout, and HttpError wrapping (ARCH-02).
 */

export class HttpError extends Error {
    constructor(message, options = {}) {
        super(message, options);
        this.name = options.name || 'HttpError';
        this.status = options.status || null;
    }
}

/**
 * Send a JSON HTTP POST request with optional AbortSignal or timeoutMs.
 * @param {string} url
 * @param {object} body
 * @param {AbortSignal|{ signal?: AbortSignal, timeoutMs?: number }} [signalOrOptions]
 * @returns {Promise<Response>}
 */
export async function httpPost(url, body, signalOrOptions = {}) {
    const isSignal = signalOrOptions && typeof signalOrOptions.aborted === 'boolean';
    const externalSignal = isSignal ? signalOrOptions : signalOrOptions?.signal;
    const timeoutMs = (!isSignal && Number.isFinite(signalOrOptions?.timeoutMs))
        ? signalOrOptions.timeoutMs
        : 10_000;

    const controller = new AbortController();
    const timer = externalSignal ? null : setTimeout(() => controller.abort(), timeoutMs);
    const activeSignal = externalSignal || controller.signal;

    try {
        return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: typeof body === 'string' ? body : JSON.stringify(body),
            signal: activeSignal,
        });
    } catch (err) {
        if (err?.name === 'AbortError') {
            const abortErr = new HttpError(err.message || 'The operation was aborted', {
                cause: err,
                name: 'AbortError',
            });
            throw abortErr;
        }
        throw new HttpError(err?.message || 'HTTP request failed', { cause: err });
    } finally {
        if (timer) clearTimeout(timer);
    }
}
