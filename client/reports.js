Template.reports.helpers({
	yearMonths: function(){
		return Session.get('yearMonths');
	},
	isOpen: function(){
		return this.closed == 0 || this.closed == 2;
	},
	isClosed: function()
	{
		return this.closed == 1 || this.closed == 2;
	},
	accounts: function(){
		var getYearMonth = function(date)
		{
			var month = pad('00', date.getMonth() + 1, true);
			var year = date.getFullYear();
			return {
				month : month,
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
		var yearMonthsArray = [];
		var yearMonths = [];
		var trans = Transactions.find({project: Session.get('currentProject')}).fetch();
		trans.forEach(function(transaction){
			var yearMonth = getYearMonth(transaction.date);
			var yearMonthsNum = yearMonthsArray.indexOf(yearMonth.yearMonth);
			if(yearMonthsNum == -1)
			{
				yearMonthsArray.push(yearMonth.yearMonth);
				yearMonths.push({yearMonth:yearMonth.yearMonth, closed: transaction.closed ? 1 : 0});
			}
			else
			{
				if(
					yearMonths[yearMonthsNum].closed == 0 && transaction.closed
					|| yearMonths[yearMonthsNum].closed == 1 && !transaction.closed
				)
				{
					yearMonths[yearMonthsNum].closed = 2;
				}
			}
			var accounts = [
				{
					from: true, account: transaction.fromAccount
				},
				{
					from: false, account: transaction.toAccount
				}
			];
			accounts.forEach(function(account){
				var amount = (account.from ? 1 : -1) * transaction.amount;
				var accountNum = addAccountBalance(account.account, amount);
				var yearMonthNum = addMonth(accountNum, transaction.date);
				addCategoryAmount(accountNum, yearMonthNum, transaction.category, amount);
			})
		});
		Session.set('yearMonths', yearMonths);
		return accountsReports.accounts;
	}
});
Template.reports.events({
	'click .close': function(event){
		Meteor.call(
			'closeOpenYearMonth',
			Session.get('currentProject'),
			this.yearMonth,
			true,
			function(error, result){
				if(error)
				{
					alert(error.error);
				}
			}
		);
		return false;
	},
	'click .open': function(event){
		Meteor.call(
			'closeOpenYearMonth',
			Session.get('currentProject'),
			this.yearMonth,
			false,
			function(error, result){
				if(error)
				{
					alert(error.error);
				}
			}
		);
		return false;
	}
});
