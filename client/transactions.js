var fromAccounts = [];
var toAccounts = [];
var categories = [];
var subCategories = [];
initSelects = function(){
	initProjectSelect2();
	if(Session.get('currentProject')) {
		initSelect2('#fromAccount', fromAccounts);
		initSelect2('#toAccount', toAccounts);
		initSelect2('#category', categories);
		initSelect2('#subCategory', subCategories);
	}
};
Meteor.startup(function(){
	Tracker.autorun(function(){
		if(Session.get('currentProject'))
		{
			var fromAccountsStrings = [];
			var toAccountsStrings = [];
			var categoriesStrings = [];
			var subCategoriesStrings = [];
			fromAccounts = [];
			toAccounts = [];
			categories = [];
			subCategories = [];
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
				if (subCategoriesStrings.indexOf(transaction.subCategory) == -1) {
					subCategoriesStrings.push(transaction.subCategory);
					subCategories.push({id: transaction.subCategory, text: transaction.subCategory});
				}
			});
			initSelects()
		}
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
				initSelect2('#subCategory', subCategories, transaction.subCategory);
			}
			else
			{
				initSelect2('#fromAccount', fromAccounts, null);
				initSelect2('#toAccount', toAccounts, null);
				initSelect2('#category', categories, null);
				initSelect2('#subCategory', subCategories, null);
			}
		}
	});

});



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
	datePattern: function(){
		return datePattern;
	},
	transactions: function(){
		return Transactions.find({project: Session.get('currentProject')},{sort:{date: -1}});
	},
	defaultFromAccount: function(){
		return getCurrentTransactionProperty('fromAccount', '');
	},
	defaultToAccount: function(){
		return getCurrentTransactionProperty('toAccount', '');
	},
	defaultItemText: function(){
		return getCurrentTransactionProperty('itemText', '');
	},
	defaultCategory: function(){
		return getCurrentTransactionProperty('category', '');
	},
	defaultSubCategory: function(){
		return getCurrentTransactionProperty('subCategory', '');
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
		return false;
	},
	'submit .addTransaction': function (event) {
		var obj = {
			project: Session.get('currentProject'),
			fromAccount: event.target.fromAccount.value,
			toAccount: event.target.toAccount.value,
			itemText: event.target.itemText.value,
			category: event.target.category.value,
			subCategory: event.target.subCategory.value,
			dollarAmount: event.target.dollarAmount.value,
			dollarToTl: $('#dollarToTl').val(),
			tlAmount: event.target.tlAmount.value,
			dollarToEuro: $('#dollarToEuro').val(),
			euroAmount: event.target.euroAmount.value,
			date: new Date(event.target.date.value),
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
