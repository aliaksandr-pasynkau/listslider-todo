"use strict";
module.exports = function(grunt){

    return {

        lang_en: {

            options: {
                excludeEmpty: true
            },

            files: [
                {
                    expand: true,
                    cwd: "src/client/",
                    src: [
                        'js/*',
                        'templates/*',
                        'styles/*'
                    ],
                    dest: "_temp_/en/"
                }
            ]
        }
    };
};