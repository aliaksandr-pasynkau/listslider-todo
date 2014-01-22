'use strict';
module.exports = function(grunt){

	var _ = require('underscore');

	var incOptions = {
		cwd: 'client/js',
		rename: function(base, path) {
			return path.replace(/\.js$/, '');
		}
	};

	var include = _(grunt.file.expandMapping(['controllers/**/*.js', 'controllers/*.js'], '', incOptions)).pluck('dest');

	return {
		compile: {
			options: {
				appDir: 'client',
				baseUrl: 'js',
				dir: 'build/client',
				modules: [
					{
						name: 'main',
						include: include,
						insertRequire: ['main']
					}
				],
				mainConfigFile: 'client/js/config.js',
				almond: true,
				optimize: 'uglify2',
				useStrict: true,
				normalizeDirDefines:"skip",
				keepBuildDir: false,
				preserveLicenseComments: false,
				inlineText: false,
//				generateSourceMaps: true,
//				cssIn: 'styles/index.css',
//				out: 'build/client/styles/main.css',
//				optimizeCss: 'standard.keepLines',
//				cssImportIgnore: null,
//				uglify2: {
//					//Example of a specialized config. If you are fine
//					//with the default options, no need to specify
//					//any of these properties.
//					output: {
//						beautify: false
//					},
//					compress: {
//						sequences: false,
//						global_defs: {
//							DEBUG: false
//						}
//					},
//					warnings: true,
//					mangle: false
//				},
//				uglify: {
//					toplevel: true,
//					ascii_only: true,
//					beautify: true,
//					max_line_length: 1000,
//
//					//How to pass uglifyjs defined symbols for AST symbol replacement,
//					//see "defines" options for ast_mangle in the uglifys docs.
//					defines: {
//						DEBUG: ['name', 'false']
//					},
//
//					//Custom value supported by r.js but done differently
//					//in uglifyjs directly:
//					//Skip the processor.ast_mangle() part of the uglify call (r.js 2.0.5+)
//					no_mangle: true
//				}

			}
		}
//		css: {
//			options: {
//				out: 'build/client/styles/main.css',
//				optimizeCss: 'standard.keepLines',
//				cssImportIgnore: null,
//				cssIn: 'client/styles/index.css'
//			}
//		}
	};



};