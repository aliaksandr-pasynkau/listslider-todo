"use strict";

module.exports = function (grunt) {
	var opt = this;

	this.watch('specs', {
		files: [
			opt.SRC + '/api/**/*.spec.{json,js}'
		],
		tasks: [
			'api/specs',
			'api-tester/build'
		]
	});

	this.watch('php', {
		files: [
			opt.SRC + '/api/**/*.php'
		],
		tasks: [
			'api/build',
			'pragma'
		]
	});

};