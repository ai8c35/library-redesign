// JavaScript Document

// Shim in Date.now()
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

$(window).load(function() {
    var hasTouch = ('ontouchstart' in window);
    
    $('.bk-carousel').each(function(i, element) {
        // Get some references for later use
        var $carousel = $(element),
            carouselWidth,
            $container = $carousel.find('.bk-carousel-items'),
            $items = $container.children(),
            $leftArrow = $carousel.find('.bk-carousel-back'),
            $rightArrow = $carousel.find('.bk-carousel-forward'),
            position = 0,
            lastMove = Date.now(),
            width = 0; // Calculated momentarily
        
        var updateCarouselWidth = function() {
                carouselWidth = $carousel.parent().innerWidth();

                $carousel.css({
                    width: carouselWidth + 'px'
                });
            },
            checkArrows = function() {
                if (!hasTouch) {
                    if (carouselWidth < $container.outerWidth()) {
                        $leftArrow.show();
                        $rightArrow.show();
                    }
                    else {
                        $leftArrow.hide();
                        $rightArrow.hide();
                    }
                }
            },
            moveCarousel = function(pixels) {
                pixels || (pixels = 0);
                
                // Can be negative, if there aren't enough items to fill the screen
                var maxWidth = width - carouselWidth;
                
                position += pixels;

                position = Math.max(0, position);
                
                // Only clamp if this is a positive value.
                if (maxWidth >= 0) {
                    position = Math.min(position, maxWidth);
                }

                $container.css({
                    left: -position + 'px'
                });
                
                lastMove = Date.now();
            },
            // t = current time, b = start value, c = change in value, d = duration
            // A more detailed discussion of easing functions: http://www.kirupa.com/html5/animating_with_easing_functions_in_javascript.htm
            easeOutQuad = function (t, b, c, d) {
                t /= d;
                return -c * t*(t-2) + b;
            },
            decelerateTimer,
            // startVelocity = Pixels/Millisecond, duration = milliseconds
            decelerate = function(startVelocity, duration) {
                var startTime = Date.now(),
                    lastTime = startTime,
                    stepDown = function() {
                        var now = Date.now(),
                            timeSinceStart = now - startTime, // Milliseconds
                            timeSinceLast = now - lastTime,
                            currentVelocity = easeOutQuad(timeSinceStart, startVelocity, -startVelocity, duration),
                            xDelta = currentVelocity * timeSinceLast; // Pixels/Millisecond * Milliseconds = Pixels

                        moveCarousel(-xDelta);

                        if (timeSinceStart < duration) {
                            lastTime = now;
                            decelerateTimer = setTimeout(stepDown, 15);
                        }
                    };

                decelerateTimer = setTimeout(stepDown, 15);
            };
        
        updateCarouselWidth();
        
        $items.each(function(i, element) {
            width += $(element).outerWidth(true);
        });
        
        $container.css('width', width + 'px');
        
        checkArrows();
            
        $('window').resize(function() {
            updateCarouselWidth();
            checkArrows();
        });
        
        //
        // Set up mouse interactions
        
        if (!hasTouch) {
            var scrollSpeed = 0.25, // Pixels/Millisecond
                scrollIntervalTime = 15, // Milliseconds
                scrollPixels = scrollSpeed * scrollIntervalTime, // Precalculate
                scrollInterval;

            $leftArrow.on('mouseenter', function() {
                clearTimeout(decelerateTimer);

                scrollInterval = setInterval(function() {
                    moveCarousel(-scrollPixels);
                }, scrollIntervalTime);
            });

            $leftArrow.on('mouseleave', function() {
                clearInterval(scrollInterval);

                decelerate(scrollSpeed, 1000);
            });

            $rightArrow.on('mouseenter', function() {
                clearTimeout(decelerateTimer);

                scrollInterval = setInterval(function() {
                    moveCarousel(scrollPixels);
                }, scrollIntervalTime);
            });

            $rightArrow.on('mouseleave', function() {
                clearInterval(scrollInterval);

                decelerate(-scrollSpeed, 1000);
            });
        
            $carousel.on('mouseenter', 'a', function(event) {
                var isbn = $(event.currentTarget).data('isbn');

                if (isbn) {
                    $('#carousel-detail-' + isbn).show();
                }
            });

            $carousel.on('mouseleave', 'a', function(event) {
                var isbn = $(event.currentTarget).data('isbn');

                if (isbn) {
                    $('#carousel-detail-' + isbn).hide();
                }
            });
        }
        
        //
        // Set up touch interactions
        if (hasTouch) {
            var touches = [],
                copyTouchInfo = function(touch) {
                    return {
                        identifier: touch.identifier,
                        pageX: touch.pageX
                    };
                },
                getTouchInfoById = function(id) {
                    for (var i = touches.length; i--; ) {
                        if (touches[i].identifier == id) {
                            return touches[i];
                        }
                    }

                    return null;
                },
                stopTouch = function(event) {
                    var lastTouches = [];

                    for (var changed = event.originalEvent.changedTouches, i = changed.length; i--; ) {
                        for (var j = touches.length; j--; ) {
                            if (changed[i].identifier == touches[j].identifier) {
                                lastTouches.push(touches[j]);
                                touches.splice(j, 1);
                                break;
                            }
                        }
                    }

                    var totalDelta = 0;

                    for (i = lastTouches.length; i--; ) {
                        totalDelta += lastTouches[i].dx;
                    }

                    if (!touches.length) {
                        var averageChange = totalDelta / lastTouches.length,
                            timeChange = Date.now() - lastMove;

                        decelerate(averageChange / timeChange, 1000);
                    }
                };

            $container.on('touchstart', function(event) {
                clearTimeout(decelerateTimer);

                for (var changed = event.originalEvent.changedTouches, i = changed.length; i--; ) {
                    touches.push(copyTouchInfo(changed[i]));
                }
            });

            $container.on('touchmove', function(event) {
                var total = 0;

                for (var changed = event.originalEvent.changedTouches, i = changed.length; i--; ) {
                    var touch = changed[i],
                        oldTouch = getTouchInfoById(touch.identifier),
                        dx = touch.pageX - oldTouch.pageX;

                    oldTouch.pageX = touch.pageX;
                    oldTouch.dx = dx;

                    total += dx;
                }

                
                moveCarousel(-total / changed.length);
            });

            $container.on('touchend', stopTouch);
            $container.on('touchleave', stopTouch);
        }
    });
});