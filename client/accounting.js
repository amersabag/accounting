var projects = [];
var fromAccounts = [];
var toAccounts = [];
var categories = [];
Template.registerHelper('formatDate', function(date){
	return date
		? date.getFullYear() + '-'
			+ pad('00', (date.getMonth() + 1), true) + '-'
			+ pad('00', date.getDate(), true)
		: '';
});
initSelect2 = function(selector, data, item, onChange)
{
	if(!onChange){ onChange = function(){}; }
	var $input = $(selector);
	if(!$input.length)
	{
		Meteor.setTimeout(function(){ initSelect2(selector, data, item, onChange)}, 50);
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
		$input.select2('val', item);
	}
};
initProjectSelec2 = function(){
	initSelect2(
		'#projects',
		projects,
		Session.get('currentProject'),
		function(e){
			Session.set('currentProject', e.val)
		}
	);
};
initSelects = function(){
	initProjectSelec2();
	if(Session.get('currentProject')) {
		initSelect2('#fromAccount', fromAccounts);
		initSelect2('#toAccount', toAccounts);
		initSelect2('#category', categories);
	}
};
Meteor.subscribe('transactions');
Meteor.startup(function(){
	Session.set('currentPage', 'transactions');
	Tracker.autorun(function(){
		if(Session.get('currentProject'))
		{
			var fromAccountsStrings = [];
			var toAccountsStrings = [];
			var categoriesStrings = [];
			fromAccounts = [];
			toAccounts = [];
			categories = [];
			var transactions = Transactions.find().fetch();
			transactions.forEach(function (transaction) {
				if (fromAccountsStrings.indexOf(transaction.fromAccount) == -1) {
					fromAccountsStrings.push(transaction.fromAccount);
					fromAccounts.push({id: transaction.fromAccount, text: transaction.fromAccount});
				}
				if (toAccountsStrings.indexOf(transaction.toAccount) == -1) {
					toAccountsStrings.push(transaction.toAccount);
					toAccounts.push({id: transaction.toAccount, text: transaction.toAccount});
				}
				if (categoriesStrings.indexOf(transaction.category) == -1) {
					categoriesStrings.push(transaction.category);
					categories.push({id: transaction.category, text: transaction.category});
				}
			});
			initSelects()
		}
	});
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
		initProjectSelec2();
	});
	Tracker.autorun(function(){
		console.log('tracker selects');
		if(Session.get('currentProject'))
		{
			var transaction;
			if(Session.get('currentTransactionId')
				&& (transaction = Transactions.findOne(Session.get('currentTransactionId')))
			)
			{
				initSelect2('#fromAccount', fromAccounts, transaction.fromAccount);
				initSelect2('#toAccount', toAccounts, transaction.toAccount);
				initSelect2('#category', categories, transaction.category);
			}
			else
			{
				initSelect2('#fromAccount', fromAccounts, null);
				initSelect2('#toAccount', toAccounts, null);
				initSelect2('#category', categories, null);
			}
		}
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

Template.reports.helpers({
	accounts: function(){
		var getYearMonth = function(date)
		{
			var month = date.getMonth() + 1;
			var year = date.getFullYear();
			return {
				month : pad('00', month, true),
				year : year,
				yearMonth : year + '-' + month
			}
		};
		var accountsReports = {
			accountsStrings: [],
			accounts: []
		};
		var addAccountBalance = function(account, balance, increment)
		{
			increment = increment ? increment : true;
			var accountNum = accountsReports.accountsStrings.indexOf(account);
			if(accountNum == -1)
			{
				accountNum = accountsReports.accountsStrings.push(account) - 1;
				accountsReports.accounts.push({
					account: account,
					totalBalance : balance,
					monthsArray: [],
					months: []
				});
			}
			else if(increment){
				accountsReports.accounts[accountNum].totalBalance += balance;
			}
			return accountNum;
		};
		var addMonth = function(accountNum, date)
		{
			var yearMonth = getYearMonth(date);
			var yearMonthNum = accountsReports.accounts[accountNum].monthsArray.indexOf(yearMonth.yearMonth);
			if(yearMonthNum == -1)
			{
				yearMonthNum = accountsReports.accounts[accountNum].monthsArray.push(yearMonth.yearMonth) - 1;
				accountsReports.accounts[accountNum].months.push({
					year: yearMonth.year,
					month: yearMonth.month,
					categoriesArray: [],
					categories: []
				});
			}
			return yearMonthNum;
		};
		var addCategoryAmount = function(accountNum, yearMonthNum, category, sumAmount, increment)
		{
			increment = increment ? increment : true;
			var categoryNum = accountsReports.accounts[accountNum].months[yearMonthNum].categoriesArray.indexOf(category);
			if(categoryNum == -1)
			{
				categoryNum = accountsReports.accounts[accountNum].months[yearMonthNum].categoriesArray.push(category) - 1;
				accountsReports.accounts[accountNum].months[yearMonthNum].categories.push({
					category: category,
					sumAmount: sumAmount
				});
			}
			else if(increment)
			{
				accountsReports.accounts[accountNum].months[yearMonthNum].categories[categoryNum].sumAmount += sumAmount;
			}
			return categoryNum;
		};
		var reports = Reports.find({project: Session.get('currentProject')}, {sort: {year: -1, month: -1, category: 1}}).fetch();
		var accountNum, yearMonthNum;
		reports.forEach(function(report)
		{
			accountNum = addAccountBalance(report.account, report.totalBalance);
			yearMonthNum = addMonth(accountNum, new Date(report.year + '-' + report.month + '-01'));
			addCategoryAmount(accountNum, yearMonthNum, report.category, report.sumAmount);
		});

		var trans = Transactions.find({closed: {$ne: true}, project: Session.get('currentProject')}).fetch();
		trans.forEach(function(item){
			var accounts = [
				{
					from: true, account: item.fromAccount
				},
				{
					from: false, account: item.toAccount
				}
			];
			accounts.forEach(function(account){
				var amount = (account.from ? 1 : -1) * item.amount;
				accountNum = addAccountBalance(account.account, amount);
				yearMonthNum = addMonth(accountNum, item.date);
				addCategoryAmount(accountNum, yearMonthNum, item.category, amount);
			})
		});
		return accountsReports.accounts;
	}
});
Template.body.onRendered(initProjectSelec2);
Template.transactions.onRendered(initSelects);
getCurrentTransactionProperty = function(property, defaultValue)
{
	var transaction;
	if(
		Session.get('currentTransactionId')
		&& (transaction = Transactions.findOne(Session.get('currentTransactionId')))
	)
	{
		return transaction[property];
	}
	else
	{
		return defaultValue;
	}
};
Template.transactions.helpers({
  transactions: function(){
	  return Transactions.find({project: Session.get('currentProject')},{sort:{date: -1}});
  },
	defaultFromAccount: function(){
		return getCurrentTransactionProperty('fromAccount', '');
	},
	defaultToAccount: function(){
		return getCurrentTransactionProperty('toAccount', '');
	},
	defaultCategory: function(){
		return getCurrentTransactionProperty('category', '');
	},
	defaultDollarAmount: function(){
		return getCurrentTransactionProperty('dollarAmount', '');
	},
	defaultTlAmount: function(){
		return getCurrentTransactionProperty('tlAmount', '');
	},
	defaultEuroAmount: function() {
		return getCurrentTransactionProperty('euroAmount', '');
	},
	defaultDate: function(){
		return getCurrentTransactionProperty('date', new Date());
  },
	defaultInvoiceLink: function(){
		return getCurrentTransactionProperty('invoiceLink', '');
	},
	defaultDescription: function(){
		return getCurrentTransactionProperty('description', '');
	},
	defaultNote: function(){
		return getCurrentTransactionProperty('note', '');
	}

});

Template.transactions.events({
	'click .deleteTransaction': function(event){
		var id = this._id;
		Meteor.call('deleteTransaction', this._id, function(error, result){
			if(error)
			{
				alert(error.error);
			}
			else
			{
				if(Session.get('currentTransactionId') == id)
				{
					Session.set('currentTransactionId', null);
				}
			}
		});
	},
	'click .transactionId': function(event){
		Session.set('currentTransactionId', this._id);
		return false;
	},
	'click .reset': function()
	{
		Session.set('currentTransactionId', null);
	},
  'submit .addTransaction': function (event) {
    var obj = {
	    project: Session.get('currentProject'),
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
	  if(Session.get('currentTransactionId'))
	  {
		  obj._id = Session.get('currentTransactionId');
	  }
    Meteor.call('addModifyTransaction', obj, function(error, value){
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
}
