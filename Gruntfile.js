module.exports = function (grunt) {
    grunt.initConfig({
        lineremover: {
            main: {
                files: {
                    'public/compiled/core.js': 'public/compiled/core.js'
                },
                options: {
                    exclusionPattern: /^\s*$|(?:\r\n|\n|^)(?:[^'"])*?(?:'(?:[^\r\n\\']|\\'|[\\]{2})*'|"(?:[^\r\n\\"]|\\"|[\\]{2})*")*?(?:[^'"])*?(\/\*(?:[\s\S]*?)\*\/|\/\/.*)/
                }
            }
        },
        less: {
            development: {
                options: {
                    compress: true,
                    yuicompress: true,
                    optimization: 2
                },
                files: {
                    "public/compiled/style.css": "public/stylesheets/**/*.less"
                }
            }
        },
        ngAnnotate: {
            app: {
                // annotate both files
                files: {
                    'public/compiled/core.min.js': 'public/compiled/core.min.js',
                    'public/compiled/core.js': 'public/compiled/core.js'
                }
            }
        },
        concat: {
            lib: {
                src: [
                    // load important dependencies first
                    'public/javascripts/lib/jquery-3.1.1.js',
                    'public/javascripts/lib/angular.js',
                    'public/javascripts/lib/angular-ui-router.js',
                    'public/javascripts/lib/angular-animate.js',
                    'public/javascripts/lib/ng-file-upload-all.js',
                    'public/javascripts/lib/**/*.js'
                ],
                dest: 'public/compiled/lib.js',
                options: {
                    separator: ';'
                }
            },
            src: {
                src: [
                    'public/javascripts/src/helpers.js',
                    'public/javascripts/src/app.js',
                    'public/javascripts/src/**/*.js'
                ],
                dest: 'public/compiled/core.js'
            }
        },
        uglify: {
            lib: {
                files: {
                    'public/compiled/lib.min.js': ['<%= concat.lib.dest %>']
                }
            },
            src: {
                files: {
                    'public/compiled/core.min.js': ['<%= concat.src.dest %>']
                }
            }
        },
        watch: {
            // libraries
            lib: {
                files: ['public/javascripts/lib/**/*.js'],
                tasks: ['lib']
            },
            // source code
            src: {
                files: ['public/javascripts/src/**/*.js'],
                tasks: ['src']
            },
            // less and templates
            less: {
                files: ['public/templates/**/*.html', 'public/stylesheets/**/*.less'],
                tasks: ['less'],
                // will let the browser reload spontaneously, allows for a better workflow
                options: {
                    livereload: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-line-remover');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('default', ['less', 'concat', 'ngAnnotate', 'uglify', "lineremover:main"]);

    grunt.registerTask('lib', ['concat:lib', 'uglify:lib']);
    grunt.registerTask('src', ['concat:src', 'ngAnnotate', 'uglify:src', "lineremover:main"]);
};
