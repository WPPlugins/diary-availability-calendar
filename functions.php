<?php
# PHP Calendar (version 2.3), written by Keith Devens
function daac_make_calendar($year, $month, $activeDay='', $day_name_length = 3, $month_href = NULL, $first_day = 0, $pn = array()) {
	global $wpdb, $entries_table;
	
	# Get unavailable days from the db
	$unavailableDays = get_option('daac_unavailable_days', array());	
	
	# Get the booked range from the db for a period of one month
	$rangeStart  = mktime(0,0,0,$month,0,$year);
	$rangeEnd    = mktime(0,0,0,$month+1,0,$year);
	
	$bookedDays  = array();
	
	$sql = "select date from ".$wpdb->prefix.$entries_table." where unix_timestamp(date) between $rangeStart and $rangeEnd";
		
	$results = $wpdb->get_results($sql, ARRAY_A);
		
	if(count($results) > 0) {
		for($i=0;$i<count($results);$i++) {
			$row          = $results[$i];
			$bookedDate   = $row["date"];
			$bookedDay    = explode('-',$bookedDate);
			$bookedDays[] = $bookedDay[2]; // (Y-m-d)
		}
	}
	
	$first_of_month = gmmktime(0,0,0,$month,1,$year);

	# remember that mktime will automatically correct if invalid dates are entered
	# for instance, mktime(0,0,0,12,32,1997) will be the date for Jan 1, 1998
	# this provides a built in "rounding" feature to daac_make_calendar()

  $day_names = array(); # generate all the day names according to the current locale
  
	for($n=0,$t=(3+$first_day)*86400; $n<7; $n++, $t+=86400) # January 4, 1970 was a Sunday
    $day_names[$n] = ucfirst(gmstrftime('%A',$t)); # %A means full textual day name

	list($month, $year, $month_name, $weekday) = explode(',',gmstrftime('%m,%Y,%B,%w',$first_of_month));
	$weekday = ($weekday + 7 - $first_day) % 7; #adjust for $first_day
	$title   = htmlentities(ucfirst($month_name)).'&nbsp;'.$year;  # note that some locales don't capitalize month and day names

	#Begin calendar. Uses a real <caption>. See http://diveintomark.org/archives/2002/07/03
	
	@list($p, $pl) = each($pn); @list($n, $nl) = each($pn); # previous and next links, if applicable
	if($p) $p = '<span>'.($pl ? '<a href="'.htmlspecialchars($pl).'">'.$p.'</a>' : $p).'</span>&nbsp;';
	if($n) $n = '&nbsp;<span>'.($nl ? '<a href="'.htmlspecialchars($nl).'">'.$n.'</a>' : $n).'</span>';
	
	$calendar = '<table class="daac-calendar">'."\n".
							'<thead>
								<tr>
									<td id="daac_calendar_prev" class="daac-calendar-control">&laquo;</td>
									<td class="daac-calendar-caption" colspan="5"><h3 class="daac-calendar-month">'.$p.($month_href ? '<a href="'.htmlspecialchars($month_href).'">'.$title.'</a>' : $title).$n.'</h3></td>
									<td id="daac_calendar_next" class="daac-calendar-control daac-calendar-control-next">&raquo;</td>
								</tr>
							</thead>'."\n".
							'<tr>';

	if($day_name_length){ #if the day names should be shown ($day_name_length > 0)
			#if day_name_length is >3, the full name of the day will be printed
			foreach($day_names as $d)
					$calendar .= '<th abbr="'.htmlentities($d).'">'.htmlentities($day_name_length < 4 ? substr($d,0,$day_name_length) : $d).'</th>';
			$calendar .= "</tr>\n<tr>";
	}

	if($weekday > 0) $calendar .= '<td class="daac-calendar-cell-pad" colspan="'.$weekday.'">&nbsp;</td>'; #initial 'empty' days
		
	for($day=1,$days_in_month=gmdate('t',$first_of_month); $day<=$days_in_month; $day++,$weekday++) {
		
		$classes = 'daac-calendar-day';
		
		$Ymd = implode('-',array($year,$month,str_pad($day, 2, '0', STR_PAD_LEFT)));
		
		if($weekday == 7){
				$weekday   = 0; #start a new week
				$calendar .= "</tr>\n<tr>";
		}
		
		if(!empty($activeDay)) {
			if($activeDay == implode('-', array($year, str_pad($month, 2, '0', STR_PAD_LEFT), str_pad($day, 2, '0', STR_PAD_LEFT)))) {
				$classes .= ' daac-calendar-active';
			}
		}
		
		if(implode('-', array($year,$month,str_pad($day, 2, '0', STR_PAD_LEFT))) == date('Y-m-d')) {
			$classes .= ' daac-calendar-today'.(empty($activeDay) ? ' daac-calendar-active' : '');
		}
		
		if(in_array($Ymd, $unavailableDays)) {
			$classes .= ' daac-calendar-unavailable';								
		}
		else {
			$classes .= ' daac-calendar-bookable';
			
			if(in_array($day,$bookedDays)) {
				$classes .= ' daac-calendar-booked';
			}
		}
		 
		$calendar .= '<td class="'.$classes.'">'.$day.'<input type="hidden" name="daac_current_day" value="'.$Ymd.'" /></td>';
	}
  
	if($weekday != 7) $calendar .= '<td class="daac-calendar-cell-pad" colspan="'.(7-$weekday).'">&nbsp;</td>'; #remaining "empty" days
	
  $calendar .= "</tr>\n</table>\n";
	$calendar .= "<input type=\"hidden\" name=\"daac_month\" value=\"".$month."\" /><input type=\"hidden\" name=\"daac_year\" value=\"".$year."\" />";
	
	return $calendar;
}

function daac_get_entries($year, $month, $day) {
	global $wpdb, $entries_table;
	
	$bookings = array(); // output
	
	$sql = "SELECT * FROM ".$wpdb->prefix.$entries_table." WHERE date = '$year-$month-$day' ORDER BY start ASC";
	$results = $wpdb->get_results($sql, ARRAY_A);
	
	if(count($results) > 0) {
		for($i=0; $i<count($results); $i++) {
			$row = $results[$i];
			
			$bookings[] = array(
				'title' => $row["title"],
				'start' => $row["start"],
				'end' => $row["end"],
				'id' => $row["id"]
			);
		}
	}
	
	return $bookings;
}
?>
