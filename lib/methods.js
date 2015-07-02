transactionInClosedMonth = function(transaction)
{
	return Reports.find({
		project: transaction.project,
		year: transaction.date.getFullYear(),
		month: transaction.date.getMonth() + 1
	}).count()
};
projectOwnedByOthers = function(transaction)
{
	return Transactions.find({project: transaction.project, createdBy: {$ne: Meteor.userId()}}).count();
};
Meteor.methods({
	deleteTransaction: function(_id)
	{
		var transaction = Transactions.find(_id);
		if(transaction.count())
		{
			transaction = transaction.fetch();
			if(transaction.createdBy != Meteor.userId)
			{
				throw new Meteor.Error('Transaction is not yours!');
			}
			if(transactionInClosedMonth(transaction))
			{
				throw new Meteor.Error('Cannot delete from closed month!')
			}
		}
		else
		{
			throw new Meteor.Error('The transaction was not found!');
		}
	},
	addModifyTransaction: function(obj)
	{
		var amount = 0;
		if(!obj.project)
		{
			throw new Meteor.Error('You cannot have empty project!');
		}
		if(
			!obj.fromAccount
			|| !obj.toAccount
			|| obj.fromAccount == obj.toAccount
		)
		{
			throw new Meteor.Error('You cannot have empty or the same from/to accounts!');
		}
		if(!obj.category)
		{
			throw new Meteor.Error('You cannot have empty category!');
		}

		if(obj.dollarAmount)
		{
			amount += Number(obj.dollarAmount);
		}
		if(obj.tlAmount)
		{
			if(obj.dollarToTl)
			{
				amount += Number(obj.tlAmount) / Number(obj.dollarToTl);
			}
			else
			{
				throw new Meteor.Error('There is no dollar to tl ratio specified!');
			}
		}
		if(obj.euroAmount)
		{
			if(obj.dollarToEuro)
			{
				amount += Number(obj.euroAmount) / Number(obj.dollarToEuro);
			}
			else
			{
				throw new Meteor.Error('There is no dollar to euro ratio specified!');
			}
		}
		if(transactionInClosedMonth(obj))
		{
			throw new Meteor.Error('You cannot add/modify/delete from closed month!');
		}
		if(projectOwnedByOthers(obj))
		{
			throw new Meteor.Error('The project is not yours!');
		}
		var newObj = {
			project: obj.project,
			fromAccount: obj.fromAccount,
			toAccount: obj.toAccount,
			amount: Math.round(amount * 1000)/1000,
			dollarAmount: obj.dollarAmount,
			dollarToTl: obj.dollarToTl,
			tlAmount: obj.tlAmount,
			dollarToEuro: obj.dollarToEuro,
			euroAmount: obj.euroAmount,
			date: new Date(obj.date),
			category: obj.category,
			invoiceLink: obj.invoiceLink,
			description: obj.description,
			note: obj.note,
			createdAt: new Date(),
			createdBy: Meteor.userId()
		};
		if(obj._id)
		{
			var transaction = Transactions.find(obj._id);
			if(transaction.createdBy != Meteor.userId)
			{
				throw new Meteor.Error('This transactions is not yours!');
			}
			Transactions.update(obj._id, newObj);
		}
		else{
			Transactions.insert(newObj);
		}
		return false;
	}

});