module.exports = function(grunt) {
  'use strict';

  var path = require('path');

  // Allow user to specify template to send through the CLI
  var template = grunt.option('template');
  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    /**
     * Project Paths
     */
    paths: {
      // Store the finished files here
      dist: 'dist',

      // Temporary folder to build things
      tmp: 'tmp',

      // Where our images are located
      images: 'img',

      // Where the email templates are located
      templates: 'templates',

      // Where the Sass files are located
      sass: 'sass',

      // Where are CSS is located
      css: 'css',

      // Where data files are living
      data: 'data',

      // Where partials are living
      partials: 'partials',

      // Where the jade files are living
      views: 'views'
    },

    /**
     * Before generating any new files, clean the /dist/ directory.
     */
    clean: {
      dist: ['<%= paths.dist %>', '<%= paths.tmp %>']
    },

    /**
     * Compile the Sass files using Compass
     */
    compass: {
      dist: {
        options: {
          sassDir: '<%= paths.sass %>',
          cssDir: '<%= paths.css %>',
          environment: 'production'
        }
      }
    },

    /**
     * Task to copy images to the dist directory
     *
     * This doesn't minify them, but you can run grunt dist to minify them and copy them over.
     */
    copy: {
      images: {
        expand: true,
        cwd: '<%= paths.images %>',
        src: ['**/*.{gif,png,jpg}'],
        dest: '<%= paths.dist %>/img'
      }
    },

    /**
     * Insert the media query css into the document manually.
     *
     * Remember: you'll need to update each style section as you add/remove templates.
     */
    htmlbuild: {
      dist: {
        src: ['<%= paths.dist %>/*.html'],
        dest: '<%= paths.dist %>',
        options: {
          relative: true,
          styles: {
            basic: ['<%= paths.css%>/basic.css', '<%= paths.css %>/mq.css'],
            hero: ['<%= paths.css%>/hero.css', '<%= paths.css %>/mq.css'],
            sidebar: ['<%= paths.css%>/sidebar.css', '<%= paths.css %>/mq.css'],
            sidebarHero: ['<%= paths.css%>/sidebar-hero.css', '<%= paths.css %>/mq.css'],
            actiemail: ['<%= paths.css%>/actiemail.css'],
            outlookfooter: ['<%= paths.css%>/outlookfooter.css']
          }
        }
      }
    },

    /**
     * Image optimization
     */
    imagemin: {
      options: {
        progressive: false
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.images %>',
          src: ['**/*.{gif,png,jpg}'],
          dest: '<%= paths.dist %>/img'
        }]
      }
    },

    // Send a test email to whomever we choose
    nodemailer: {

      options: {

        /**
         * Defaults to sendmail if you don't specify a transport below
         * See config/nodemailer-transport.json for a sample Gmail config,
         * or visit https://github.com/andris9/Nodemailer for all options
         */
        transport: grunt.file.readJSON('config/nodemailer-transport.json'),

        // By default, generate text from our HTML template automatically
        generateTextFromHTML: true,

        message: {
          from: 'Ronald Konjer <ronaldkonjer@gmail.com>',
          subject: 'Email template test'
        },

        // A collection of recipients
        recipients: [
          {
            email: 'ronaldkonjer@gmail.com',
            name: 'Ronald Konjer'
          }
          /*{
            email: 'rkonjer@hanos.nl',
            name: 'Ronald Konjer'
          }*/
        ]
      },

      // Load the HTML template from our dist directory.
      dist: {
        src: ['<%= paths.dist %>/' + template + '.html']
      }
    },

    /**
     * Inline the CSS from the external file into the document
     * This also copies the templates into the /dist/ folder
     */
    premailer: {
      main: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: ['**/*.html'],
          dest: '<%= paths.dist %>/'
        }]
      }
    },

    emailBuilder: {
      inline: {
        files: [{
          expand: true,
          cwd: '<%= paths.tmp %>',
          src: ['**/*.html'],
          dest: '<%= paths.dist %>/'
        }]
      }
    },

    
    //compile the jade files
    jade: {
      compile: {
        options: {
          pretty: true,
          data: {
            debug: false
          }
        },
        files: [{
          expand: true, // Enable dynamic expansion.
          cwd: '<%= paths.views %>', // Src matches are relative to this path.
          src: ['*.jade', '!*/*.jade'],
          dest: '<%= paths.templates %>', // Destination path prefix.
          ext: '.html' // Dest filepaths will have this extension.
        }]
      }
    },


    /**
     * Render EJS templates and data into HTML documents
     */
    render: {
      options: {
        data: ['<%= paths.data %>/*.json'],
        //partialPaths: ['<%= paths.partials %>']
      },

      dev: {
        files: [{
          expand: true,
          cwd: '<%= paths.templates %>',
          src: ['**/*.html'],
          dest: '<%= paths.dist %>'
        }]
      },

      dist: {
        files: [{
          expand: true,
          cwd: '<%= paths.templates %>',
          src: ['**/*.html'],
          dest: '<%= paths.tmp %>'
        }]
      }
    },

    /**
     * This helps us watch changes to the files and reloads/recompiles when necessary
     */
    watch: {
      // Watch the .SCSS files for changes and recompile them
      sass: {
        files: ['<%= paths.sass %>/*.scss'],
        tasks: ['compass','htmlbuild'],
        options: {
          livereload: true
        }
      },

      // Watch the template files for changes, inline their css files again, and recompile them
      templates: {
        files: ['<%= paths.templates %>/*.html', '<%= paths.partials %>/**/*.html', '<%= paths.data %>/*.json'],
        tasks: ['render:dev','htmlbuild'],
        options: {
          livereload: true
        }
      },

      jade: {
        files: ['<%= paths.views %>/**/*.jade'],
        tasks: ['jade','htmlbuild'],
        options: {
          livereload: true
        }
      },

      // Watch our files for changes and reload the browser
      livereload: {
        files: ['<%= paths.dist %>/*.html', '<%= paths.dist %>/img/*'],
        options: {
          livereload: true
        }
      }
    },
    connect: {
      options: {
        port: 9000,
        livereload: 35729,
        // change this to '0.0.0.0' to access the server from outside
        hostname: 'localhost'
      },
      livereload: {
        options: {
          open: true,
          base: [
            '<%= paths.dist %>'
          ]
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= paths.dist %>',
          livereload: false
        }
      }
    },
    concurrent: {
      dev: [
        'compass',
        'jade',
        'copy'
        /*'responsive_images',*/
        /*'copy:styles'*/
        /*'copy:scss'*/
      ],
      dist: [
        'compass',
        'jade',
        'imagemin'
      ]
    }

  });

	grunt.registerTask('serve', function(target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }
    // In development, do everything but premailer and imagemin
    grunt.task.run([
      'clean',
      'concurrent:dev',
      'render:dev', 
      'htmlbuild',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', function() {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve']);
  });


  // In development, do everything but premailer and imagemin
  /*grunt.registerTask('dev', ['clean', 'concurrent:dev' 'render:dev', 'htmlbuild']);*/

  // To distribute, do the other two steps
  grunt.registerTask('build', [
  	'clean', 
  	'concurrent:dist', 
  	'render:dist', 
  	'emailBuilder',
    //'premailer', 
  	'htmlbuild'
  ]);

  // Register a send tast to simulate an email delivery
  grunt.registerTask('send', 'Simulates an email delivery.', function() {
    if (!template) {
      grunt.fail.fatal('You need to specify a template to send: --template=templateName');
    }

    grunt.task.run([
      'build',
      'nodemailer'
    ]);
  });

  
  // By default, do the dev version
  grunt.registerTask('default', ['serve']);
}
