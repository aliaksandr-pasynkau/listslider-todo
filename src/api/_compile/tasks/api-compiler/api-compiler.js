"use strict";
module.exports = function(grunt){

	var _ = require('underscore');
	var utils = require('./_utils.js');

	var options = {
		cwd: 'src/api/definition/',
		src: [
			'*.json',
			'**/*.json'
		],
		jsonSpaces: 4,
		apiRoot: '/api',
		destSourceJsonFile: 'build/api/var/api.source.json',
		destParsedJsonFile: 'build/api/var/api.parsed.json'
	};

	options.cwd = options.cwd.replace(/[\\\/]*$/, '/');

	var parseRequestOption = function (optionData, optionName, apiName) {

		var result = utils.parse.paramDirective(optionName, apiName);

		if (!result) {
			throw new Error(apiName + ': has invalid format');
			return null;
		}

		result.validation = utils.parse.validation(optionData, apiName);

		if (result.validation.required) {
			delete result.validation.optional;
		} else if (!result.validation.optional) {
			utils.addRule(result, 'required', [], apiName);
		}
		if (result.type == 'string') {
			utils.addFilter(result, false, 'before', 'trim');
			utils.addFilter(result, false, 'after', 'xss');
		}
		if (result.length.min) {
			utils.addRule(result, 'min_length', [result.length.min], apiName);
		}
		if (result.length.max) {
			utils.addRule(result, 'max_length', [result.length.max], apiName);
		}
		if (/decimal|integer|float/.test(result.type)) {
			utils.addRule(result, result.type, [], apiName);
		}
		if (result.category == 'URL') {
			result.url_index = apiName.indexOf("$" + result.name);
			if(result.url_index < 0 ) {
				throw new Error('"' + optionName + '" has invalid URL param. param "' + result.name + '" is not attach in url string "' + optionName + '"');
			}
		}
		delete result.length;
		return result;
	};

	var parseResponseOption = function (directive, options, apiName){
		var response = {};
		directive.replace(/^response[:]?(?:(one|many)\s*\(([^\)]+)\)\s*)?$/, function (word, type, params) {
			response.type = type || 'one';
			if(params){
				response.pagenator = {};
				params.replace(/^\s*\{([^\}]+)\}\s*([^\s]*)\s*$/, function(word, limits, pageNumber){
					var category;
					if (pageNumber) {
						if (/^[0-9]$/.test(pageNumber)) {
							response.pagenator.page_number = pageNumber;
						} else if (/^[$@>]?[a-zA-Z_0-9]+$/.test(pageNumber)) {
							response.pagenator.page_param_name = pageNumber.replace(/^[$@>]/, '');
							category = pageNumber.replace(/^([$@>])(.+)$/, '$1');
							response.pagenator.page_param_category = category == '$' ? 'URL' : (category == '@' ? 'QUERY' : 'INPUT');
						} else {
							throw new Error(apiName + ': Invalid type of response "'+params+'" param PAGE_NUMBER');
						}
					}

					var LIMIT_EXP = /^\s*([$@>]?)([a-zA-Z][a-zA-Z0-9_]*)(?:\s*,\s*([1-9][0-9]*))?\s*$/;
					if (LIMIT_EXP.test(limits)) {
						response.pagenator.limit_param_name = limits.replace(LIMIT_EXP, '$2');
						category = limits.replace(LIMIT_EXP, '$1');
						response.pagenator.limit_param_category = category == '$' ? 'URL' : (category == '@' ? 'QUERY' : 'INPUT');
						response.pagenator.max_limit = limits.replace(LIMIT_EXP, '$3') || 255;
					} else if (/^\s*([1-9][0-9]*)\s*$/.test(limits)) {
						response.pagenator.max_limit = limits.replace(/^\s*([0-9]+)\s*$/, '$1') || 255;
					} else {
						throw new Error(apiName + ': Invalid type of response LIMITS "' + limits +'" in response params"' + params + '"');
					}
					return '';
				});
				if (!response.pagenator) {
					throw new Error(apiName + ': has invalid format in response params "' + params + '"');
				}
			}
			return '';
		});
		if (!response){
			throw new Error(apiName + ': Invalid type of response param "'+directive+'" : \n'+JSON.stringify(options,null, 4));
		}
		if (_.isArray(options)) {
			options = {data: options};
		}
		response.output = {
			data: utils.parse.varParam({}, options.data, apiName),
			meta: utils.parse.varParam({}, options.meta, apiName)
		};
		if (!response.output.data && !response.output.meta){
			throw new Error(apiName + ': EMPTY response param ');
		}
		return response;
	};

	var compile = function(source){
		var resultApi = {};
		_.each(source, function(apiData, apiName){
			var title = apiName;
			var request = {};
			var response = {};
			var access = {
				need_login: false,
				only_owner: false
			};
			_.each(apiData, function(options, directive){
				if (directive === 'access') {
					_.extend(access, options);
					return;
				}
				if (directive === 'title') {
					title = options;
					return;
				}
				if (/^request/.test(directive)) {
					request.input = _.map(options, function(option, optionName){
						if (_.isObject(option)){
							optionName += option.before ? '#' + option.before.join('#') : '';
							optionName += option.after ? '*' + option.after.join('*') : '';
							option = option.rules || '';
						}
						return parseRequestOption(option, optionName, apiName);
					});
					return;
				}
				if (/^response/.test(directive)) {
					response = parseResponseOption(directive, options, apiName);
				}
			});

			request.input = _.groupBy(request.input, 'category');
			var _requestInput = {};
			_.each(request.input, function (params, type) {
				_requestInput[type] = {};
				_.each(params, function (param) {
					_requestInput[type][param.name] = _.omit(param, 'category');
				});
			});
			request.input = _requestInput;

			if (request.input.URL) {
				request.input.URL = _.sortBy(request.input.URL, "url_index");
			}

			var hasError = false;
			if (response.paginator) {
				if (response.paginator.limit_param_category){
					if (!request.input[response.paginator.limit_param_category]){
						throw new Error('"' + apiName + '" :  hasn\'t input param of "' + response.paginator.limit_param_category + '" category for LIMIT param of RESPONSE;');
					}
					if (response.paginator.limit_param_category == 'URL') {
						hasError = !_.contains(_.pluck(request.input.URL, 'name'), response.paginator.limit_param_name);
					} else {
						hasError = !!request.input[response.paginator.limit_param_category] && !!request.input[response.paginator.limit_param_category][response.paginator.limit_param_name];
					}

					if (hasError) {
						throw new Error('"' + apiName + '" :  hasn\'t input param name "' + response.paginator.limit_param_name + '" of "' + response.paginator.limit_param_category + '" category for LIMIT param of RESPONSE;');
					}
				}
				hasError = false;
				if (response.paginator.page_param_category){
					if (!request.input[response.paginator.page_param_category]){
						throw new Error('"' + apiName + '" :  hasn\'t input param of "' + response.paginator.page_param_category+ '" category for PAGE_NUMBER param of RESPONSE;');
					}
					if (response.paginator.page_param_category == 'URL') {
						hasError = !_.contains(_.pluck(request.input.URL, 'name'), response.paginator.page_param_category);
					} else {
						hasError = !!request.input[response.paginator.page_param_category] && !!request.input[response.paginator.page_param_category][response.paginator.page_param_category];
					}
					if (hasError) {
						throw new Error('"' + apiName + '" :  hasn\'t input param name "' + response.paginator.page_param_name + '" of "' + response.paginator.page_param_category + '" category for LIMIT param of RESPONSE;');
					}
				}
			}

			var parseApi = utils.parse.apiName(apiName);

			// RESULT
			var api = {};
			api['url'] = parseApi.url;
			api['params_count'] = (request.input.URL || []).length;
			api['method'] = parseApi.method;
			api['request'] = request;
			api['response'] = response;
			api['access'] = access;
			api['api_name'] = apiName;
			api['api_version'] = parseApi.version;
			api['id'] = utils.make.apiCellName(parseApi.method, parseApi.url, api['params_count']);
			resultApi[api['id']] = api;
		});
		return resultApi;
	};

	return function(){
		var fs = grunt.file.expand({cwd: options.cwd}, options.src);
		var source = {};

		_.each(fs, function(fpath){
			_.extend(source, grunt.file.readJSON(options.cwd + fpath));
		});

		// compile
		var parsed = compile(source);

		parsed['options'] = {};
		parsed['options']['api_root'] = options.apiRoot;

		grunt.file.write(options.destSourceJsonFile, JSON.stringify(source, null, options.jsonSpaces));
		grunt.file.write(options.destParsedJsonFile, JSON.stringify(parsed, null, options.jsonSpaces));

		grunt.log.ok('file ' + options.destSourceJsonFile,' was created');
		grunt.log.ok('file ' + options.destParsedJsonFile,' was created');
		grunt.log.ok('total: ' + _.keys(parsed).length + ' items');
	};

};