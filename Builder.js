var gulp = require('gulp'),
    watch = require('gulp-watch'),
    prefixer = require('gulp-autoprefixer'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    livereload = require('gulp-livereload'),
    argv = require('yargs').argv;

var Builder = (function () {
    var DEBUG_MODE = 100;
    var RELEASE_MODE = 110;

    var _path = {
        build: { //Тут мы укажем куда складывать готовые после сборки файлы
            html: 'build/',
            js: 'build/js/',
            css: 'build/css/',
            img: 'build/img/',
            fonts: 'build/fonts/'
        },
        src: { //Пути откуда брать исходники
            html: 'src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
            js: {
                release: 'src/js/*.js', //В стилях и скриптах нам понадобятся только main файлы
                debug: 'src/js/**/*.js'
            },
            style: {
                release: ['src/style/*.scss', 'src/style/*.sass'],
                debug: ['src/style/**/*.scss', 'src/style/**/*.sass']
            },
            img: 'src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
            fonts: 'src/fonts/**/*.*',
        },
        watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
            html: 'src/**/*.html',
            js: 'src/js/**/*.js',
            style: 'src/style/**/(*.scss|*.sass)',
            img: 'src/img/**/*.*',
            fonts: 'src/fonts/**/*.*'
        },
        clean: './build'
    };
    var _private = {
        build: {
            release: {
                html: function (self) {
                    return _private.build.common.html(self);
                },
                js: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.js.release) //Найдем наш main файл
                            .pipe(rigger()) //Прогоним через rigger
                            .pipe(sourcemaps.init()) //Инициализируем sourcemap
                            .pipe(uglify()) //Сожмем наш js
                            .pipe(sourcemaps.write()) //Пропишем карты
                            .pipe(gulp.dest(self.path.build.js)) //Выплюнем готовый файл в build
                    );
                },
                styles: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.style.release) //Выберем наш main.scss
                            .pipe(sourcemaps.init()) //То же самое что и с js
                            .pipe(sass()) //Скомпилируем
                            .pipe(prefixer()) //Добавим вендорные префиксы
                            .pipe(cssmin()) //Сожмем
                            .pipe(sourcemaps.write())
                            .pipe(gulp.dest(self.path.build.css)) //И в build
                    );
                },
                images: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.img) //Выберем наши картинки
                            .pipe(imagemin({ //Сожмем их
                                progressive: true,
                                svgoPlugins: [{removeViewBox: false}],
                                use: [pngquant()],
                                interlaced: true
                            }))
                            .pipe(gulp.dest(self.path.build.img)) //И бросим в build
                    );
                },
                fonts: function (self) {
                    return _private.build.common.fonts(self);
                }
            },
            debug: {
                html: function (self) {
                    return _private.build.common.html(self);
                },
                js: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.js.debug) //Найдем наши js файлы
                            .pipe(rigger()) //Прогоним через rigger
                            .pipe(gulp.dest(self.path.build.js)) //Выплюнем готовый файл в build
                    );
                },
                styles: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.style.debug) //Выберем наши стили
                            .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError)) //Скомпилируем
                            .pipe(prefixer()) //Добавим вендорные префиксы
                            .pipe(gulp.dest(self.path.build.css)) //И в build
                    );
                },
                images: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.img) //Выберем наши картинки
                            .pipe(gulp.dest(self.path.build.img))
                    );
                },
                fonts: function (self) {
                    return _private.build.common.fonts(self);
                }
            },
            common: {
                html: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.html)  //Выберем файлы по нужному пути
                            .pipe(rigger()) //Прогоним через rigger
                            .pipe(gulp.dest(self.path.build.html)) //Выплюнем их в папку build
                    );
                },
                reload: function (source) {
                    return source.pipe(livereload());
                },
                fonts: function (self) {
                    return _private.build.common.reload(
                        gulp.src(self.path.src.fonts)
                            .pipe(gulp.dest(self.path.build.fonts))
                    );
                }
            },
        },
        watch: {
            html: function (self) {
                watch([self.path.watch.html], function(event, cb) {
                    self.buildHtml();
                });
            },
            styles: function (self) {
                watch([self.path.watch.style], function(event, cb) {
                    self.buildStyles();
                });
            },
            js: function (self) {
                watch([self.path.watch.js], function(event, cb) {
                    self.buildJs();
                });
            },
            fonts: function (self) {
                watch([self.path.watch.fonts], function (event, cb) {
                    self.buildFonts();
                });
            },
            images: function (self) {
                watch([self.path.watch.img], function(event, cb) {
                    self.buildImages();
                });
            }
        }
    };

    function _module(config) {
        var self = this;
        this.mode = null;
        this.path = _path;
        this.isNeedPreClean = false;

        if (config) {
            if (config.argv) {
                var isDebug = (config.argv.debug !== undefined || config.argv.release === undefined);
                this.mode = isDebug ? DEBUG_MODE : RELEASE_MODE;
                this.isNeedPreClean = (argv.clean !== undefined);
            }
        }
        this.setConfig = function(cfg) {
            this.mode = cfg.mode || this.mode;
            this.path = cfg.path || this.path;
        };

        this.buildHtml = function () {
            return this.mode === RELEASE_MODE ?
                _private.build.release.html(this) :
                _private.build.debug.html(this);
        };
        this.watchHtml = function () {
            _private.watch.html(this);
        };
        this.buildJs = function () {
            return this.mode === RELEASE_MODE ?
                _private.build.release.js(this) :
                _private.build.debug.js(this);
        };
        this.watchJs = function() {
            _private.watch.js(this);
        };
        this.buildStyles = function() {
            return this.mode === RELEASE_MODE ?
                _private.build.release.styles(this) :
                _private.build.debug.styles(this);
        };
        this.watchStyles = function() {
            _private.watch.styles(this);
        };
        this.buildImages = function() {
            return this.mode === RELEASE_MODE ?
                _private.build.release.images(this) :
                _private.build.debug.images(this);
        };
        this.watchImages = function() {
            _private.watch.images(this);
        };
        this.buildFonts = function () {
            return this.mode === RELEASE_MODE ?
                _private.build.release.fonts(this) :
                _private.build.debug.fonts(this);
        };
        this.watchFonts = function() {
            _private.watch.fonts(this);
        };
        this.clean = function(done) {
            return rimraf(this.path.clean, done);
        };

        gulp.task('html', () => {
            return this.buildHtml()
        });
        gulp.task('js', () => {
            return this.buildJs()
        });
        gulp.task('styles', () => {
            return this.buildStyles()
        });
        gulp.task('images', () => {
            return this.buildImages()
        });
        gulp.task('fonts', () => {
            return this.buildFonts()
        });
        gulp.task('all', (done) => {
            if (this.isNeedPreClean) {
                this.clean(done);
            }
            this.buildFonts();
            this.buildImages();
            this.buildStyles();
            this.buildJs();
            this.buildHtml();
            done();
        });
        gulp.task('clean', (done) => {
            return this.clean(done)
        });
        gulp.task('cleanBeforeLoad', (done) => {
            if (this.isNeedPreClean) {
                console.log('Deleting previous build.');
                return this.clean(done);
            } else {
                console.warn(
                    'Please note that the files of the previous build are not deleted. ' +
                    'There may be conflicts. \nTo start the watcher with pre-purge, use ' +
                    'the \'gulp --clean\'. The task for cleaning is \'gulp clean\'.');
                done();
            }
        });
        gulp.task('watch', function (done) {
            livereload.listen();
            self.watchHtml();
            self.watchStyles();
            self.watchJs();
            self.watchImages();
            self.watchFonts();
            done();
        });
        gulp.task('default', gulp.series('cleanBeforeLoad', 'all', 'watch'));
    }

    _module.prototype.DEBUG_MODE = DEBUG_MODE;
    _module.prototype.RELEASE_MODE = RELEASE_MODE;
    return _module;
})();

var inst = new Builder({argv: argv});
module.exports = inst;