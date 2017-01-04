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
	'click .transactionId': function(){
		Session.set('currentTransactionId', this._id);
		return false;
	},
	'click .reset': function()
	{
		Session.set('currentTransactionId', null);
		return false;
	},
	'submit .addTransaction': function (event) {
		var transaction = {
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
			transaction._id = Session.get('currentTransactionId');
		}
		Meteor.call('addModifyTransaction', transaction, function(error, value){
			if(error)
			{
				alert(error.error);
			}
			else{
				event.target.reset();
				$('#fromAccount').select2('val', null);
				$('#toAccount').select2('val', null);
				$('#category').select2('val', null);
				$('#subCategory').select2('val', null);
			}
		});
		return false;
	}
});
Template.transactions.onRendered(function(){
	initFromAccountSelect2();
	initToAccountSelect2();
	initCategorySelect2();
	initSubCategorySelect2();
});
