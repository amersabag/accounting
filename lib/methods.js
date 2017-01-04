datePattern = '(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))';
transactionInClosedMonth = function(transaction)
{
	return Transactions.find({
		project: transaction.project,
		year: transaction.date.getFullYear(),
		month: transaction.date.getMonth() + 1,
		closed: true
	}).count()
};
projectOwnedByOthers = function(transaction)
{
	return Transactions.find({project: transaction.project, createdBy: {$ne: Meteor.userId()}}).count();
};
Meteor.methods({
	closeOpenYearMonth: function(project, yearMonth, close){
		if(!project)
		{
			throw new Meteor.Error('There must be a project!');
		}
		var datePatternRegex = new RegExp(datePattern);
		if(!yearMonth || yearMonth.match(datePatternRegex))
		{
			throw new Meteor.Error('Invalid year month!')
		}
		var yearMonthDate = new Date(yearMonth + '-01');
		var yearMonthNextDate = new Date(yearMonthDate.getFullYear(), yearMonthDate.getMonth()+1, 1);
		if(Transactions.find({
				$and: [
					{project: project},
					{date: {$gte: yearMonthDate}},
					{date: {$lt: yearMonthNextDate}},
					{createdBy: {$ne: Meteor.userId()}}
				]
			}).count())
		{
			throw new Meteor.Error('YearMonth is not yours completely!');
		}
		Transactions.update({
			$and: [
				{project: project},
				{date: {$gte: yearMonthDate}},
				{date: {$lt: yearMonthNextDate}}
			]
		}, {$set: {closed: close}});
	},
	deleteTransaction: function(_id)
	{
		var transaction = Transactions.findOne(_id);
		if(transaction)
		{
			if(transaction.createdBy != Meteor.userId())
			{
				throw new Meteor.Error('Transaction is not yours!');
			}
			if(transactionInClosedMonth(transaction))
			{
				throw new Meteor.Error('Cannot delete from closed month!')
			}
			Transactions.remove(_id);
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
			itemText: obj.itemText,
			category: obj.category,
			subCategory: obj.subCategory,
			amount: Math.round(amount * 1000)/1000,
			dollarAmount: obj.dollarAmount,
			dollarToTl: obj.dollarToTl,
			tlAmount: obj.tlAmount,
			dollarToEuro: obj.dollarToEuro,
			euroAmount: obj.euroAmount,
			date: new Date(obj.date),
			invoiceLink: obj.invoiceLink,
			description: obj.description,
			note: obj.note,
			createdAt: new Date(),
			createdBy: Meteor.userId()
		};
		if(obj._id)
		{
			var transaction = Transactions.findOne(obj._id);
			if(transaction && transaction.createdBy != Meteor.userId())
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