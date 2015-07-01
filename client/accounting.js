fromAccounts = [];
toAccounts = [];
accountsArray = [];
accountsReports = [];
initSelects = function(){
	if(!$('#fromAccount').length || !$('#fromAccount').length )
	{
		Meteor.setTimeout(initSelects, 50);
	}
	else
	{
		$('#fromAccount').select2({
			data: fromAccounts,
			width: 'resolve',
			createSearchChoice:function(term, data) {
				if ( $(data).filter( function() {
						return this.text.localeCompare(term) === 0;
					}).length===0) {
					return {id:term, text:term};
				}
			}
		});
		$('#toAccount').select2({
			data: toAccounts,
			width: 'resolve',
			createSearchChoice:function(term, data) {
				if ( $(data).filter( function() {
						return this.text.localeCompare(term) === 0;
					}).length===0) {
					return {id:term, text:term};
				}
			}
		});
	}
};
Meteor.subscribe('transactions');
Meteor.startup(function(){
	Session.set('currentPage', 'transactions');
	Tracker.autorun(function() {
		var fromAccountsStrings = [];
		var toAccountsStrings = [];
		fromAccounts = [];
		toAccounts = [];
		var trans = Transactions.find().fetch();
		trans.forEach(function (item) {
			if (fromAccountsStrings.indexOf(item.fromAccount) == -1) {
				fromAccountsStrings.push(item.fromAccount);
				fromAccounts.push({id: item.fromAccount, text: item.fromAccount});
			}
			if (toAccountsStrings.indexOf(item.toAccount) == -1) {
				toAccountsStrings.push(item.toAccount);
				toAccounts.push({id: item.toAccount, text: item.toAccount});
			}
		});
		initSelects()
	});
});
Template.body.helpers({
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

Template.reports.helpers({
	accounts: function(){
		var trans = Transactions.find().fetch();
		trans.forEach(function(item){
			var month = pad('00', (item.createdAt.getMonth() + 1), true);
			var year = item.createdAt.getFullYear();
			var yearMonth = year + '-' + month;
			var accounts = [
				{
					from: true, account: item.fromAccount
				},
				{
					from: false, account: item.toAccount
				}
			];
			accounts.forEach(function(account){
				var multiply = account.from ? 1 : -1;
				var accountNum = accountsArray.indexOf(account.account);
				if(accountNum == -1)
				{
					accountsArray.push(account.account);
					accountsReports.push({
						account: account.account,
						totalBalance : multiply * item.amount,
						monthsArray: [yearMonth],
						months: [
							{
								month: month,
								year: year,
								categoriesArray: [item.category],
								categories: [
									{
										category: item.category,
										sumAmount: multiply * item.amount
									}
								]
							}
						]
					});
				}
				else
				{
					accountsReports[accountNum].totalBalance += multiply * item.amount;
					var monthYearNum = accountsReports[accountNum].monthsArray.indexOf(yearMonth)
					if(monthYearNum == -1)
					{
						accountsReports[accountNum].monthsArray.push(yearMonth);
						accountsReports[accountNum].months.push({
							month: month,
							year: year,
							categoriesArray: [item.category],
							categories: [
								{
									category: item.category,
									sumAmount: multiply * item.amount
								}
							]
						});
					}
					else
					{
						var categoryNum = accountsReports[accountNum].months[monthYearNum].categoriesArray.indexOf(item.category);
						if(categoryNum == -1)
						{
							accountsReports[accountNum].months[monthYearNum].categoriesArray.push(item.category);
							accountsReports[accountNum].months[monthYearNum].categories.push({
								category: item.category,
								sumAmount: multiply * item.amount
							});
						}
						else
						{
							accountsReports[accountNum].months[monthYearNum].categories[categoryNum].sumAmount += multiply * item.amount;
						}
					}
				}
			})
		});
		return accountsReports;
	}
});
Template.transactions.helpers({
  transactions: function(){
	  return Transactions.find();
  },
  currentDate: function(){
	  var t = new Date();
	  return t.getFullYear() + '-' + pad('00', (t.getMonth() + 1), true) + '-' + pad('00', t.getDate(), true);
  }
});

Template.transactions.events({
  'submit .addTransaction': function (event) {
    var obj = {
	    fromAccount: event.target.fromAccount.value,
	    toAccount: event.target.toAccount.value,
	    dollarAmount: event.target.dollarAmount.value,
	    dollarToTl: $('#dollarToTl').val(),
	    tlAmount: event.target.tlAmount.value,
	    dollarToEuro: $('#dollarToEuro').val(),
	    euroAmount: event.target.euroAmount.value,
	    date: new Date(event.target.date.value),
	    category: event.target.category.value,
	    invoiceLink: event.target.invoiceLink.value,
	    description: event.target.description.value,
	    note: event.target.note.value
    };
	  console.log(obj);
    Meteor.call('addTransaction', obj, function(error, value){
	    if(error)
	    {
		    alert(error.error);
	    }
	    else{
		    event.target.reset();
	    }
    });
    return false;
  }
});


function pad(pad, str, padLeft) {
	if (typeof str === 'undefined')
		return pad;
	if (padLeft) {
		return (pad + str).slice(-pad.length);
	} else {
		return (str + pad).substring(0, pad.length);
	}
};
