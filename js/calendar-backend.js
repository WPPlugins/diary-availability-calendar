(function($) {
	$(function() {												
		$('#daac-error-log').hide(); // Hide the error log initially
		
		var currentActiveDay = ''; // The current active day, as a date stamp (Y-m-d)
		
			
		/**
			*	Mark Unavailable Days
			*/
		
		var markUnavailableMode = false;
		
		$('#daac-mark-days').click(function() {
			if(markUnavailableMode) {
				markUnavailableMode = false;
				
				$(this).removeClass('daac-calendar-active');
			}
			else {
				markUnavailableMode = true;
				
				$(this).addClass('daac-calendar-active');
			}
			
			return false;
		});
																	
		/**
			*	Calendar DAY events
			*/
			
		var attachDayControls = function() {
			var days = $('.daac-calendar td.daac-calendar-day');
			
			days.each(function() {
				
				var day = $(this);
				
				$(this).click(function() {
															 									
					if(markUnavailableMode) {
						
						/**
							*	Mark days as unavailable
							*/
							
						var data = {
							action: 'daac_make_day_unavailable',
							date: $('input', this).attr('value')
						}
						$.post(MyAjax.ajaxurl, data, function(response) {
							if(day.hasClass('daac-calendar-unavailable')) {
								day.removeClass('daac-cell-hover');
								day.removeClass('daac-calendar-unavailable');
								day.addClass('daac-calendar-bookable');
							}
							else {
								day.removeClass('daac-cell-hover');
								day.addClass('daac-calendar-unavailable');
								day.removeClass('daac-calendar-bookable');
							}
						});
						
					}
					else {
						
						/**
							*	Regular day click event
							*/
							
						currentActiveDay = $('input', this).attr('value');
						
						var data = {
							action: 'daac_fetch_booked_times',
							date: $('input', this).attr('value')
						}
						$.post(MyAjax.ajaxurl, data, function(response) {
							$('#daac-bookings-async').html(response);
							
							// Attach booking list events
							attachBookingListControls();
						});
							
						var lastActive = $('.daac-calendar td.daac-calendar-active');
						lastActive.removeClass('daac-calendar-active');
						
						$(this).addClass('daac-calendar-active');
						
						// Update booking form (date hasn't changed since our previous data object)
						data.action = 'daac_fetch_booking_form';
						
						$.post(MyAjax.ajaxurl, data, function(response) {
							$('#daac-form-container').html(response);
							$('#daac-error-log').hide();
							attachBookingFormSubmitEvent();
						});
					}
				});
				$(this).mouseenter(function() {
					//defaultBackgroundColor = $(this).css('background-color');
					$(this).addClass('daac-cell-hover');
				});
				$(this).mouseleave(function() {
					$(this).removeClass('daac-cell-hover');														
				});
			});
			
		}
		
		attachDayControls();
		
		/**
			*	Booking LIST events
			*/
			
		var attachBookingListControls = function() {
			var bookingList = $('#daac-bookings .daac-bookings-booking');
			
			bookingList.each(function() {
				$(this).click(function() {
					var data = {
						action: 'daac_fetch_booking_form',
						id: $('a', this).attr('rel')
					}
					
					$.post(MyAjax.ajaxurl, data, function(response) {
						$('#daac-form-container').html(response);
						$('#daac-error-log').hide();
						
						// Make the booking form events
						attachBookingFormSubmitEvent();
						
						// Attach event to delete booking button here
						var deleteBooking = $('#daac-delete-booking');
						
						deleteBooking.click(function() {
							// Update data action, id hasn't changed
							data.action = 'daac_delete_booking';
							
							$.post(MyAjax.ajaxurl, data, function(response) {
								// Refresh bookings list
								var data = {
									action: 'daac_fetch_booked_times',
									date: getLastActiveDay()
								}
								$.post(MyAjax.ajaxurl, data, function(response) {
									$('#daac-bookings-async').html(response);
									
									// Re-attach controls
									attachBookingListControls();
								});
								
								// Get new / clean booking form
								getNewBookingForm();
								
								// Refresh Calendar
								refreshCalendar();
							});
							
							return false;
						});
					});
				});
			});
		}
		
		attachBookingListControls();
		
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
		
		/**
			*	Booking Form
			*/
		
		var attachBookingFormSubmitEvent = function() {
			$('#daac-booking-form').submit(function() {
				var inputs = $('#daac-booking-form :input');
				
				var inputData = {
					action: 'daac_validate_booking'
				};
				
				inputs.each(function(input) {
					if($(this).attr('type') != 'submit') {
						inputData[$(this).attr('name')] = $(this).val();
					}
				});
				
				$.post(MyAjax.ajaxurl, inputData, function(response) {
					if(response.num_errors > 0) {
						for(var i=0; i<response.num_errors; i++) {
							$('#daac-error-log').append('<p>' + response.errors[i] + '</p>');
						}
						
						$('#daac-error-log').slideDown('fast');
					}
					else {				
						// No errors
						// Refresh bookings list
						var data = {
							action: 'daac_fetch_booked_times',
							date: getLastActiveDay()
						}
						$.post(MyAjax.ajaxurl, data, function(response) {
							$('#daac-bookings-async').html(response);
							
							// Get new / clean booking form
							getNewBookingForm();
							
							// Refresh Calendar
							refreshCalendar();
						});
					}
				}, 'json');
				
				return false;
			});
		}
		
		attachBookingFormSubmitEvent();
		
		/**
			*	Clear form (Get empty booking form)
			*/
			
		var getNewBookingForm = function() {
			var data = {
				action: 'daac_fetch_booking_form',
				date: getLastActiveDay()
			}
			
			$.post(MyAjax.ajaxurl, data, function(response) {
				$('#daac-form-container').html(response);
				$('#daac-error-log').hide();
				
				attachBookingFormSubmitEvent();
				attachBookingListControls();
			});
		}
		
		/**
			* Refresh Calendar
			*/
			
		var refreshCalendar = function() {
			var data = {
				action: 'daac_refresh_calendar',
				date: getLastActiveDay()
			}
					
			$.post(MyAjax.ajaxurl, data, function(response) {
				$('#daac-calendar-async').html(response);
						
				attachCalendarControls(); // re-attach events
				attachDayControls(); // re-attach events
			});
		}
		
		var getLastActiveDay = function() {
			if($('.daac-calendar td.daac-calendar-active input').length > 0) {
				// there is an active day
				var date = $('.daac-calendar td.daac-calendar-active input').val();
			}
			else {
				// no active day, use the last clicked value
				var date = $('#daac-booking-form-date').val();
				date = date.split('/');
				date = new Array(date[2], date[1], date[0]).join('-');
			}
			
			return date;
		}
	});
})(jQuery);