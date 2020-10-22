 AOS.init({
 	duration: 800,
 	easing: 'slide',
 	once: true
 });

document.getElementById("register-form").onsubmit = function(e){
                e.preventDefault()

                //Get the captcha response
                var formData = new FormData(document.getElementById("register-form"))
                var captchaResponse = formData.get("g-recaptcha-response")

                fetch("/register/" + encodeURI(document.querySelector("input[type=text]").value)+"/"+encodeURI(captchaResponse), {method: "POST"})
                .then(()=>location.reload())
            }

jQuery(document).ready(function($) {

	"use strict";

	

	var siteMenuClone = function() {

		$('.js-clone-nav').each(function() {
			var $this = $(this);
			$this.clone().attr('class', 'site-nav-wrap').appendTo('.site-mobile-menu-body');
		});


		
		$('body').on('click', '.arrow-collapse', function(e) {
      var $this = $(this);
      if ( $this.closest('li').find('.collapse').hasClass('show') ) {
        $this.removeClass('active');
      } else {
        $this.addClass('active');
      }
      e.preventDefault();  
      
    });

		$(window).resize(function() {
			var $this = $(this),
				w = $this.width();

			if ( w > 768 ) {
				if ( $('body').hasClass('offcanvas-menu') ) {
					$('body').removeClass('offcanvas-menu');
				}
			}
		})

		$('body').on('click', '.js-menu-toggle', function(e) {
			var $this = $(this);
			e.preventDefault();

			if ( $('body').hasClass('offcanvas-menu') ) {
				$('body').removeClass('offcanvas-menu');
				$this.removeClass('active');
			} else {
				$('body').addClass('offcanvas-menu');
				$this.addClass('active');
			}
		}) 

		// click outisde offcanvas
		$(document).mouseup(function(e) {
	    var container = $(".site-mobile-menu");
	    if (!container.is(e.target) && container.has(e.target).length === 0) {
	      if ( $('body').hasClass('offcanvas-menu') ) {
					$('body').removeClass('offcanvas-menu');
				}
	    }
		});
	}; 
	siteMenuClone();


	var presentDate = new Date();
    var presentHrs = presentDate.getHours();

    var disp = document.getElementById("greet");

    if (presentHrs < 12)
        disp.textContent = "Good Morning";
    else if (presentHrs >= 12 && presentHrs <= 17)
        disp.textContent = "Good Afternoon";
    else if (presentHrs >= 17 && presentHrs <= 24)
        disp.textContent = "Good Evening";


});