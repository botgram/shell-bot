var GLOBAL = "Terminal";
var REPORTER="dot";
var SRC = [ "lib/**/*.js" ];

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		browserify: {
			release: {
				files: {
					"dist/terminal.js": [ "./index.js" ]
				},
				options: {
					browserifyOptions: {
						standalone: "Terminal",
					}
				},
			},
			debug: {
				files: {
					"dist/terminal.dbg.js": [ "./index.js" ]
				},
				options: {
					browserifyOptions: {
						standalone: "Terminal",
						debug: true
					}
				},
			},
		},
		uglify: {
			all: {
				files: {
					"dist/terminal.min.js": [ "dist/terminal.js" ]
				}
			}
		},
		mochaTest: {
			all: {
				src: [ "test/*.js" ],
				options: {
					reporter: REPORTER,
					require: ["test/common.js"]
				}
			}
		},
		jshint: {
			all: SRC,
			options: grunt.file.readJSON("package.json").jshintConfig,
		},
		jsdoc : {
			all: {
				src: [].concat.apply([ 'README.md' ], SRC),
				options: {
					destination: "doc",
					private: false
				}
			}
		},
		copy: {
			doc: {
				expand:true,
				src: "dist",
				dest: "doc"
			}
		},
		clean: [ "dist", "doc" ]
	});

	grunt.loadNpmTasks("grunt-browserify");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-jsdoc");
	grunt.loadNpmTasks("grunt-mocha-test");
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask("test-browser", function() {
		grunt.task.run([
				"jshint",
				"browserify:debug"
		]);
		grunt.log.write("Open file://" + __dirname +
				"/test/index.html in your browser.").ok();
	});

	grunt.registerTask("default", [
			"browserify:release",
			"uglify" ]);
	grunt.registerTask("doc", [
			"jsdoc",
			"copy:doc"
	]);
	grunt.registerTask("test", [
			"jshint",
			"mochaTest"
	]);
};
