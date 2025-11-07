import { logPlugin } from '../verbose/verboseLogger.js';

/**
 * PluginPipeline - Execute plugin interceptors
 * 
 * Responsibility: Manage plugin execution order and lifecycle
 */

export class PluginPipeline {
	
	constructor(plugins) {
		this.plugins = plugins;
	}
	
	/**
	 * Execute onRequest interceptors (L→R order)
	 */
	async executeOnRequest(context) {
		const requestPlugins = this.plugins.filter(p => p.onRequest);
		
		if (requestPlugins.length > 0) {
			logPlugin(context, 'onRequest', {
				count: requestPlugins.length,
				names: requestPlugins.map(p => p.name || 'anonymous')
			});
		}
		
		for (const plugin of this.plugins) {
			if (plugin.onRequest) {

				// Enhanced plugin expects context object
				const result = await plugin.onRequest(context);
				if (result && result !== context) {
					context.req = result;
				}
			}
		}
	}
	
	/**
	 * Execute onResponse interceptors (R→L order - reverse execution)
	 */
	async executeOnResponse(context) {
		const responsePlugins = this.plugins.filter(p => p.onResponse);
		
		if (responsePlugins.length > 0) {
			logPlugin(context, 'onResponse', {
				count: responsePlugins.length,
				names: responsePlugins.map(p => p.name || 'anonymous')
			});
		}
		
		for (let i = this.plugins.length - 1; i >= 0; i--) {
			const plugin = this.plugins[i];
			if (plugin.onResponse) {
				await plugin.onResponse(context);
			}
		}
	}
	
	/**
	 * Execute onResponseError interceptors (R→L order - reverse execution)
	 */
	async executeOnResponseError(context) {
		const errorPlugins = this.plugins.filter(p => p.onResponseError);
		
		if (errorPlugins.length > 0) {
			logPlugin(context, 'onResponseError', {
				count: errorPlugins.length,
				names: errorPlugins.map(p => p.name || 'anonymous'),
				status: context.error?.status
			});
		}
		
		for (let i = this.plugins.length - 1; i >= 0; i--) {
			const plugin = this.plugins[i];
			if (plugin.onResponseError) {
				await plugin.onResponseError(context);
			}
		}
	}
	
	/**
	 * Add a plugin to the pipeline
	 */
	add(plugin) {
		this.plugins.push(plugin);
	}
	
	/**
	 * Get all plugins
	 */
	getAll() {
		return this.plugins;
	}

}
