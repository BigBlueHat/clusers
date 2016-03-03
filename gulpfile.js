/*******************************
            Custom
*******************************/

var
  gulp         = require('gulp'),

  // require tasks as dependencies
  watch        = require('./semantic/tasks/watch'),
  build        = require('./semantic/tasks/build')
;

var browserify = require('browserify');
var source = require('vinyl-source-stream');

/*******************************
             Tasks
*******************************/

gulp.task('default', function() {
  var b = browserify({
    entries: './src/index.js',
    debug: true
  });

  gulp
    .src(['src/index.html', 'semantic/dist/semantic.min.css'])
    .pipe(gulp.dest('dist'));

  return b.bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch-ui', watch);
gulp.task('build-ui', build);

// Gulp help descriptions also work
// gulp.task('watch-ui', 'Watch UI for Semantic UI', watch);
// gulp.task('build-ui', 'Build UI for Semantic UI', build);
