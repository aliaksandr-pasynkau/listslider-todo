"use strict";

module.exports = function (grunt) {
	var opt = this;

	this.add([
		'api-tester/compile/env',
		'api-tester/compile/js',
		'api-tester/compile/styles',
		'api-tester/compile/templates',
		'api-tester/compile/page'
	]);
};
