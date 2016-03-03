/*******************************
            Custom
*******************************/

var
  gulp         = require('gulp'),

  // require tasks as dependencies
  watch        = require('./semantic/tasks/watch'),
  build        = require('./semantic/tasks/build')
;

var argv = require('yargs').argv;
var browserify = require('browserify');
var push = require('couchdb-push');
var source = require('vinyl-source-stream');

var couch_url = 'http://localhost:5984/clusers';
if ('url' in argv) {
  couch_url = argv.url;
}

/*******************************
             Tasks
*******************************/

gulp.task('default', function() {
  var b = browserify({
    entries: './src/index.js',
    debug: true
  });

  gulp
    .src(['src/index.html', 'semantic/dist/**'])
    .pipe(gulp.dest('dist'));

  return b.bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('couchapp', function() {
  gulp
    .src(['dist/**'])
    .pipe(gulp.dest('_design/clusers/_attachments'));

  push(couch_url, '_design/clusers',
    function(err, resp) {
      if (err) throw JSON.stringify(err);
      console.log(resp);
    });
});

gulp.task('watch-ui', watch);
gulp.task('build-ui', build);

// Gulp help descriptions also work
// gulp.task('watch-ui', 'Watch UI for Semantic UI', watch);
// gulp.task('build-ui', 'Build UI for Semantic UI', build);
