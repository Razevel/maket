HTML, CSS, JS макет интернет магазина пряжи. 
# 
gulp \[js/html/styles/fonts/images/all\] \[--clean\] \[--release/\[--debug\]\]- собрать файлы в выбранном режиме.

Например, 
+ gulp all --release --clean - собрать всё в режиме релиза, с минификацией и нормализацией картинок, с предварительной очиствой старой сборки.
+ gulp --clean - начать слежение за папкой src в режиме debug с предварительной очисткой прошлой сборки.