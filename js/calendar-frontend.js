(function($) {
	$(function() {
		
							
		var currentActiveDay = ''; // The current active day, as a date stamp (Y-m-d)
																	
		/**
			*	Calendar DAY events
			*/
			
		var attachDayControls = function() {
			var days = $('.daac-calendar td.daac-calendar-bookable');
			
			days.each(function() {
				$(this).click(function() {
					currentActiveDay = $('input', this).attr('value');
					
					var data = {
						action: 'daac_fetch_available_slots',
						date: $('input', this).attr('value')
					}
					$.post(MyAjax.ajaxurl, data, function(response) {
						$('#daac-available-slots-async').html(response);
	
					});
					
					var lastActive = $('.daac-calendar td.daac-calendar-active');
					lastActive.removeClass('daac-calendar-active');
					
					$(this).addClass('daac-calendar-active');
	
				});
				$(this).mouseenter(function() {
					defaultBackgroundColor = $(this).css('background-color');
					$(this).css('background-color', '#efefef');		
				});
				$(this).mouseleave(function() {
					$(this).css('background-color', defaultBackgroundColor);														
				});
			});
		}
		
		attachDayControls();
		
		/**
			*	Calendar CONTROL events
			*/
		
		var attachCalendarControls = function() {
			var calendarControls = $('.daac-calendar .daac-calendar-control');
			
			var calendarDirection = {
				daac_calendar_prev: 'back',
				daac_calendar_next: 'forward'
			}
		
			calendarControls.each(function() {
				$(this).click(function() {
					
					var data = {
						action: 'daac_fetch_calendar',
						direction: calendarDirection[$(this).attr('id')],
						currentMonth: $('input[name=daac_month]').attr('value'),
						currentYear: $('input[name=daac_year]').attr('value'),
						activeDay: currentActiveDay
					}
					
					$.post(MyAjax.ajaxurl, data, function(response) {
						$('#daac-calendar-async').html(response);
						
						attachCalendarControls(); // re-attach events
						attachDayControls(); // re-attach events
					});
				});
			});
		}
		attachCalendarControls();
	});
})(jQuery);