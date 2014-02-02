"use strict";
module.exports = function(grunt){

    return {
		'api-local-config': {
            options: {},
            files: [
                {
                    cwd: global.SRC + "/api/_config",
                    src: [
                        "database.json"
                    ],
                    dest: global.LOCAL + "/"
                }
            ]
        }
    };
};