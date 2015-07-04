var projects = [];
initSelect2 = function(selector, data, val, onChange)
{
	if(!onChange){ onChange = function(){}; }
	var $input = $(selector);
	if(!$input.length)
	{
		Meteor.setTimeout(function(){ initSelect2(selector, data, val, onChange)}, 50);
	}
	else {
		$input.select2({
			data: data,
			width: 'resolve',
			createSearchChoice: function (term, data) {
				if ($(data).filter(function () {
						return this.text.localeCompare(term) === 0;
					}).length === 0) {
					return {id: term, text: term};
				}
			}
		});
		$input.on("change", onChange);
		$input.select2('val', val);
	}
};
initProjectSelect2 = function(){
	initSelect2(
		'#projects',
		projects,
		Session.get('currentProject'),
		function(e){
			Session.set('currentProject', e.val)
		}
	);
};
Meteor.subscribe('transactions');
Meteor.startup(function(){
	Session.set('currentPage', 'transactions');
	Tracker.autorun(function() {
		var projectsStrings = [];
		projects = [];
		var transactions = Transactions.find({},{sort: {date: -1}}).fetch();
		transactions.forEach(function (transaction) {
			if (projectsStrings.indexOf(transaction.project) == -1) {
				projectsStrings.push(transaction.project);
				projects.push({id: transaction.project, text: transaction.project});
			}
		});
		if(Session.get('currentProject') && projectsStrings.indexOf(Session.get('currentProject')) == -1)
		{
			projects.push({id: Session.get('currentProject'), text: Session.get('currentProject')});
		}
		initProjectSelect2();
	});
});

Template.body.helpers({
	currentProject: function(){
		return Session.get('currentProject');
	},
	currentPageIsTransactions: function(){
		return Session.get('currentPage') == 'transactions';
	},
	currentPageIsReports: function(){
		return Session.get('currentPage') == 'reports';
	}
});
Template.body.events({
	'click #transactionsPage': function(){
		Session.set('currentPage', 'transactions');
	},
	'click #reportsPage': function(){
		Session.set('currentPage', 'reports');
	}
});

Template.body.onRendered(initProjectSelect2);

