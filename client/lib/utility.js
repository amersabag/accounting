Template.registerHelper('formatDate', function(date){
	return date
		? date.getFullYear() + '-'
	+ pad('00', (date.getMonth() + 1), true) + '-'
	+ pad('00', date.getDate(), true)
		: '';
});
