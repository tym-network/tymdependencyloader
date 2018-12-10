var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

function minifyJS() {
    return gulp.src('tymdependencyloader.js')
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('dist'));
};

gulp.watch('tymdependencyloader.js', minifyJS);

exports.default = minifyJS;