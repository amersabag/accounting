var Projects = new Mongo.Collection();
var FromAccounts = new Mongo.Collection();
var ToAccounts = new Mongo.Collection();
var Categories = new Mongo.Collection();
var SubCategories = new Mongo.Collection();
var YearMonths = new Mongo.Collection();
var Reports = new Mongo.Collection();

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
	}
};

initProjectSelect2 = function(){
	initSelect2(
		'#Projects',
		Projects.find().fetch(),
		Session.get('currentProject'),
		function(e){
			if(Session.get('currentProject') !== e.val)
			{
				Session.set('currentProject', e.val)
			}
		}
	);
};

initFromAccountSelect2 = function(){
	initSelect2('#fromAccount', FromAccounts.find({project: Session.get('currentProject')}).fetch());
};
initToAccountSelect2 = function(){
	initSelect2('#toAccount', ToAccounts.find({project: Session.get('currentProject')}).fetch());
};
initCategorySelect2 = function(){
	initSelect2('#category', Categories.find({project: Session.get('currentProject')}).fetch());
};
initSubCategorySelect2 = function(){
	initSelect2('#subCategory', SubCategories.find({project: Session.get('currentProject')}).fetch());
};

Meteor.startup(function(){
	var addTransaction = function(transaction){
		if(!Projects.findOne({text: transaction.project}))
		{
			Projects.insert({id: transaction.project, text: transaction.project});
			FromAccounts.insert({id: transaction.fromAccount, text: transaction.fromAccount, project: transaction.project});
			ToAccounts.insert({id: transaction.toAccount, text: transaction.toAccount, project: transaction.project});
			Categories.insert({id: transaction.category, text: transaction.category, project: transaction.project});
			SubCategories.insert({id: transaction.subCategory, text: transaction.subCategory, project: transaction.project});
		}
		else
		{
			if(!FromAccounts.findOne({project: transaction.project, text: transaction.fromAccount}))
			{
				FromAccounts.insert({id: transaction.fromAccount, text: transaction.fromAccount, project: transaction.project});
			}
			if(!ToAccounts.findOne({project: transaction.project, text: transaction.toAccount}))
			{
				ToAccounts.insert({id: transaction.toAccount, text: transaction.toAccount, project: transaction.project});
			}
			if(!Categories.findOne({project: transaction.project, text: transaction.category}))
			{
				Categories.insert({id: transaction.category, text: transaction.category, project: transaction.project});
			}
			if(!SubCategories.findOne({project: transaction.project, text: transaction.subCategory}))
			{
				SubCategories.insert({id: transaction.subCategory, text: transaction.subCategory, project: transaction.project});
			}
		}
		if(!YearMonths.findOne({project: transaction.project, year: transaction.date.getFullYear(), month: transaction.date.getMonth() + 1}))
		{
			YearMonths.insert({project: transaction.project, year: transaction.date.getFullYear(), month: transaction.date.getMonth() + 1});
		}
		Reports.upsert(
			{
				project: transaction.project,
				account: transaction.fromAccount,
				year: transaction.date.getFullYear(),
				month: transaction.data.getMonth() + 1,
				category: transaction.category,
				subCategory: transaction.subCategory
			},
			{
				$inc: { subAmount: transaction.amount },
				$push: { transactions: transaction._id}
			}
		);
		Reports.upsert(
			{
				project: transaction.project,
				account: transaction.toAccount,
				year: transaction.date.getFullYear(),
				month: transaction.data.getMonth() + 1,
				category: transaction.category,
				subCategory: transaction.subCategory
			},
			{
				$inc: { subAmount: -1 * transaction.amount },
				$push: { transactions: transaction._id}
			}
		);
	};
	var removeTransaction = function(transaction){
		if(!Transactions.findOne({project: transaction.project}))
		{
			Projects.remove({text: transaction.project});
			FromAccounts.remove({project: transaction.project});
			ToAccounts.remove({project: transaction.project});
			Categories.remove({project: transaction.project});
			SubCategories.remove({project: transaction.project});
		}
		else
		{
			if(!Transactions.findOne({project: transaction.project, fromAccount: transaction.fromAccount}))
			{
				FromAccounts.remove({project: transaction.project, text: transaction.fromAccount});
			}
			if(!Transactions.findOne({project: transaction.project, toAccount: transaction.toAccount}))
			{
				ToAccounts.remove({project: transaction.project, text: transaction.toAccount});
			}
			if(!Transactions.findOne({project: transaction.project, category: transaction.category}))
			{
				Categories.remove({project: transaction.project, text: transaction.category});
			}
			if(!Transactions.findOne({project: transaction.project, subCategory: transaction.subCategory}))
			{
				SubCategories.remove({project: transaction.project, text: transaction.subCategory});
			}
		}
		var yearMonthDate = new Date(
			transaction.date.getFullYear()
			+ '-' + pad('00', (transaction.date.getMonth() + 1), true)
			+ '-01');
		var yearMonthNextDate = new Date(
			yearMonthDate.getFullYear()
			+ '-' + pad(
				'00',
				(yearMonthDate.getMonth() == 11
					? 2
					: (yearMonthDate.getMonth() == 10
						? 1
						: yearMonthDate.getMonth() + 2
					)
				),
				true
			)
			+ '-01');
		if(!Transactions.findOne({
				$and: [
					{project: transaction.project},
					{date: {$gte: yearMonthDate}},
					{date: {$lt: yearMonthNextDate}}
				]
			})){
			YearMonths.remove({project: transaction.project, year: transaction.date.getFullYear(), month: transaction.date.getMonth() + 1});
		}
		if(!Transactions.findOne({
				project: transaction.project,
				account: transaction.fromAccount,
				year: transaction.date.getFullYear(),
				month: transaction.data.getMonth() + 1,
				category: transaction.category,
				subCategory: transaction.subCategory
			})){
			Reports.remove({
				project: transaction.project,
				account: transaction.fromAccount,
				year: transaction.date.getFullYear(),
				month: transaction.data.getMonth() + 1,
				category: transaction.category,
				subCategory: transaction.subCategory
			})
		}
		else
		{
			Reports.update({
					project: transaction.project,
					account: transaction.fromAccount,
					year: transaction.date.getFullYear(),
					month: transaction.data.getMonth() + 1,
					category: transaction.category,
					subCategory: transaction.subCategory
				},{
					$inc: { subAmount: -1 * transaction.amount },
					$pull: { transactions: transaction._id }
				}
			);
		}
		if(!Transactions.findOne({
				project: transaction.project,
				account: transaction.toAccount,
				year: transaction.date.getFullYear(),
				month: transaction.data.getMonth() + 1,
				category: transaction.category,
				subCategory: transaction.subCategory
			})){
			Reports.remove({
				project: transaction.project,
				account: transaction.toAccount,
				year: transaction.date.getFullYear(),
				month: transaction.data.getMonth() + 1,
				category: transaction.category,
				subCategory: transaction.subCategory
			})
		}
		else
		{
			Reports.update({
					project: transaction.project,
					account: transaction.toAccount,
					year: transaction.date.getFullYear(),
					month: transaction.data.getMonth() + 1,
					category: transaction.category,
					subCategory: transaction.subCategory
				},{
					$inc: { subAmount: transaction.amount },
					$pull: { transactions: transaction._id }
				}
			);
		}
	};
	Transactions.find().observe({
		added: function(newTransaction) {
			addTransaction(newTransaction);
		},
		changed: function(newTransaction, oldTransaction){
			removeTransaction(oldTransaction);
			addTransaction(newTransaction);
		},
		removed: function(oldTransaction){
			removeTransaction(oldTransaction);
		}
	});
	Tracker.autorun(function(){
		initProjectSelect2();
	});
	Tracker.autorun(function(){
		initFromAccountSelect2();
	});
	Tracker.autorun(function(){
		initToAccountSelect2();
	});
	Tracker.autorun(function(){
		initCategorySelect2();
	});
	Tracker.autorun(function(){
		initSubCategorySelect2();
	});
	Tracker.autorun(function(){
		var currentTransaction = Transactions.findOne(Session.get('currentTransactionId'));
		$('#fromAccount').select2('val', currentTransaction ? currentTransaction.fromAccount : null);
		$('#toAccount').select2('val', currentTransaction ? currentTransaction.toAccount : null);
		$('#category').select2('val', currentTransaction ? currentTransaction.category : null);
		$('#subCategory').select2('val', currentTransaction ? currentTransaction.subCategory : null);
	});

	Meteor.subscribe('transactions');
	Session.set('currentPage', 'transactions');
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

